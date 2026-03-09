$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $projectRoot ".tmp_case_results.json"
$chromeDriverPath = Join-Path $projectRoot "chromedriver/chromedriver-win64/chromedriver.exe"
$port = 38781
$baseUrl = "http://127.0.0.1:$port"
$sessionId = $null
$driverProc = $null
$tcpListener = $null
$listenerTask = $null

function Get-ContentType([string]$path) {
  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    default { "application/octet-stream" }
  }
}

function Start-StaticServer {
  $script:tcpListener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
  $script:tcpListener.Start()
  $script:listenerTask = [System.Threading.Tasks.Task]::Run([Action]{
    while ($script:tcpListener) {
      try { $client = $script:tcpListener.AcceptTcpClient() } catch { break }
      try {
        $stream = $client.GetStream()
        $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) { $client.Close(); continue }
        while ($true) {
          $line = $reader.ReadLine()
          if ([string]::IsNullOrEmpty($line)) { break }
        }
        $parts = $requestLine.Split(" ")
        $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { "/" }
        $cleanPath = $rawPath.Split("?")[0]
        $relative = [System.Uri]::UnescapeDataString($cleanPath.TrimStart("/"))
        if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "wiring-diagram.html" }
        $full = [IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
        $root = [IO.Path]::GetFullPath($projectRoot)
        if ($full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $full -PathType Leaf)) {
          $bytes = [IO.File]::ReadAllBytes($full)
          $headers = "HTTP/1.1 200 OK`r`nContent-Type: $(Get-ContentType $full)`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
          $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
          $stream.Write($headerBytes, 0, $headerBytes.Length)
          $stream.Write($bytes, 0, $bytes.Length)
        } else {
          $body = [Text.Encoding]::UTF8.GetBytes("Not Found")
          $headers = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
          $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
          $stream.Write($headerBytes, 0, $headerBytes.Length)
          $stream.Write($body, 0, $body.Length)
        }
        $stream.Flush()
        $client.Close()
      } catch {
        try { $client.Close() } catch {}
      }
    }
  })
}

function Stop-StaticServer {
  if ($script:tcpListener) {
    try { $script:tcpListener.Stop() } catch {}
  }
}

function Wait-ServerReady {
  $until = (Get-Date).AddSeconds(10)
  while ((Get-Date) -lt $until) {
    try {
      Invoke-WebRequest -Uri "$baseUrl/wiring-diagram.html" -UseBasicParsing | Out-Null
      return
    } catch {
      Start-Sleep -Milliseconds 200
    }
  }
  throw "Static server is not ready."
}

function Start-Driver {
  if (-not (Test-Path $chromeDriverPath -PathType Leaf)) {
    throw "chromedriver.exe not found."
  }
  $script:driverProc = Start-Process -FilePath $chromeDriverPath -ArgumentList "--port=9515" -PassThru
  $until = (Get-Date).AddSeconds(10)
  while ((Get-Date) -lt $until) {
    try {
      Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:9515/status" | Out-Null
      return
    } catch {
      Start-Sleep -Milliseconds 200
    }
  }
  throw "ChromeDriver is not ready."
}

function Stop-Driver {
  if ($script:driverProc -and -not $script:driverProc.HasExited) {
    try { Stop-Process -Id $script:driverProc.Id -Force } catch {}
  }
}

function New-Session {
  $caps = @{
    capabilities = @{
      alwaysMatch = @{
        "goog:chromeOptions" = @{
          args = @("--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=1400,2200")
        }
      }
    }
  } | ConvertTo-Json -Depth 8
  $resp = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:9515/session" -ContentType "application/json" -Body $caps
  $script:sessionId = if ($resp.value.sessionId) { $resp.value.sessionId } else { $resp.sessionId }
  if (-not $script:sessionId) { throw "Cannot create WebDriver session." }
}

function Remove-Session {
  if ($script:sessionId) {
    try { Invoke-RestMethod -Method Delete -Uri "http://127.0.0.1:9515/session/$($script:sessionId)" | Out-Null } catch {}
  }
}

function Exec-Script([string]$js, [object[]]$args = @()) {
  $body = @{ script = $js; args = $args } | ConvertTo-Json -Depth 8
  $resp = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:9515/session/$($script:sessionId)/execute/sync" -ContentType "application/json" -Body $body
  $resp.value
}

function Open-Page {
  $body = @{ url = "$baseUrl/wiring-diagram.html" } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:9515/session/$($script:sessionId)/url" -ContentType "application/json" -Body $body | Out-Null
}

function Wait-Until([scriptblock]$condition, [int]$timeoutSec = 15) {
  $until = (Get-Date).AddSeconds($timeoutSec)
  while ((Get-Date) -lt $until) {
    if (& $condition) { return $true }
    Start-Sleep -Milliseconds 200
  }
  $false
}

function Make-Japanese([int[]]$codes) {
  $chars = $codes | ForEach-Object { [char]$_ }
  -join $chars
}

function Run-Case([string]$inputText) {
  $setAndClick = @(
    'const input = document.getElementById("problemTextInput");'
    'const btn = document.getElementById("parseProblemButton");'
    'const pre = document.querySelector("#parseResultPanel pre");'
    'if (!input || !btn || !pre) return false;'
    'const before = (pre.textContent || "").trim();'
    'window.__testBeforeParse = before;'
    'input.focus();'
    'input.value = "";'
    'input.dispatchEvent(new Event("input",{bubbles:true}));'
    'input.value = arguments[0];'
    'input.dispatchEvent(new Event("input",{bubbles:true}));'
    'input.dispatchEvent(new Event("change",{bubbles:true}));'
    'btn.click();'
    'return true;'
  ) -join "`n"
  Exec-Script $setAndClick @($inputText) | Out-Null

  $parseReady = Wait-Until {
    $waitScript = @(
      'const pre = document.querySelector("#parseResultPanel pre");'
      'if (!pre) return false;'
      'const t = (pre.textContent || "").trim();'
      'const b = window.__testBeforeParse || "";'
      'return t.length > 0 && t !== b;'
    ) -join "`n"
    [bool](Exec-Script $waitScript)
  } 20

  $snapshotScript = @(
    'const txt = (id) => { const e = document.getElementById(id); return e ? (e.textContent || "").trim() : ""; };'
    'const parse = (() => { const p = document.querySelector("#parseResultPanel pre"); return p ? (p.textContent || "").trim() : ""; })();'
    'return {'
    '  parseText: parse,'
    '  warningText: txt("warning-result"),'
    '  sceneModel: txt("debug-result"),'
    '  groups: txt("group-result"),'
    '  circuits: txt("circuit-list-result"),'
    '  connectionPoints: txt("connection-point-route"),'
    '  graphLayout: txt("layout-debug-result"),'
    '  wirePaths: txt("wire-path-debug-result"),'
    '  svg: !!document.querySelector("#diagram-canvas svg"),'
    '  uiError: /fail|error/i.test(txt("ai-diagram-preview-result"))'
    '};'
  ) -join "`n"
  $snap = Exec-Script $snapshotScript

  $checks = [ordered]@{
    parser = ($parseReady -and -not [string]::IsNullOrWhiteSpace($snap.parseText))
    groups = (-not [string]::IsNullOrWhiteSpace($snap.groups))
    circuits = (-not [string]::IsNullOrWhiteSpace($snap.circuits))
    connectionPoints = (-not [string]::IsNullOrWhiteSpace($snap.connectionPoints))
    graph = (-not [string]::IsNullOrWhiteSpace($snap.graphLayout))
    layout = (-not [string]::IsNullOrWhiteSpace($snap.graphLayout))
    wirePaths = (-not [string]::IsNullOrWhiteSpace($snap.wirePaths))
    svg = [bool]$snap.svg
  }
  $failed = @($checks.Keys | Where-Object { -not $checks[$_] })

  [ordered]@{
    input = $inputText
    parseReady = $parseReady
    status = if ($failed.Count -eq 0) { "OK" } else { "要修正" }
    failedChecks = $failed
    checks = $checks
    parseText = $snap.parseText
    warningText = $snap.warningText
    sceneModel = $snap.sceneModel
    groups = $snap.groups
    circuits = $snap.circuits
    connectionPoints = $snap.connectionPoints
    graphLayout = $snap.graphLayout
    wirePaths = $snap.wirePaths
    svg = [bool]$snap.svg
    uiError = [bool]$snap.uiError
  }
}

$cases = @(
  @{ name = "case_single_1light"; input = (Make-Japanese @(29255,20999,49,28783)) },
  @{ name = "case_single_2light_same"; input = (Make-Japanese @(29255,20999,50,28783,32,21516,26178)) },
  @{ name = "case_threeway_1light"; input = (Make-Japanese @(51,36335,49,28783)) },
  @{ name = "case_threeway_2light"; input = (Make-Japanese @(51,36335,50,28783)) },
  @{ name = "case_light_plus_outlet"; input = (Make-Japanese @(29255,20999,49,28783,32,12467,12531,12475,12531,12488,49,20491)) },
  @{ name = "case_outlet_only"; input = (Make-Japanese @(29255,20999,32,12467,12531,12475,12531,12488,49,20491)) }
)

try {
  Start-StaticServer
  Wait-ServerReady
  Start-Driver
  New-Session
  Open-Page

  $initialized = Wait-Until {
    $initScript = @(
      'return !!document.getElementById("problemTextInput")'
      '&& !!document.getElementById("parseProblemButton")'
      '&& !!document.querySelector("#parseResultPanel pre");'
    ) -join "`n"
    [bool](Exec-Script $initScript)
  } 20
  if (-not $initialized) { throw "UI init timeout." }

  $results = @()
  foreach ($case in $cases) {
    $caseResult = Run-Case $case.input
    $results += [ordered]@{
      case = $case.name
      input = $caseResult.input
      parseReady = $caseResult.parseReady
      status = $caseResult.status
      failedChecks = $caseResult.failedChecks
      checks = $caseResult.checks
      parseText = $caseResult.parseText
      warningText = $caseResult.warningText
      sceneModel = $caseResult.sceneModel
      groups = $caseResult.groups
      circuits = $caseResult.circuits
      connectionPoints = $caseResult.connectionPoints
      graphLayout = $caseResult.graphLayout
      wirePaths = $caseResult.wirePaths
      svg = $caseResult.svg
      uiError = $caseResult.uiError
    }
  }

  [IO.File]::WriteAllText($outputPath, ($results | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
  Write-Host "Saved test results to $outputPath"
  $results | ForEach-Object { Write-Host ("[{0}] {1}" -f $_.status, $_.case) }
}
finally {
  Remove-Session
  Stop-Driver
  Stop-StaticServer
}
