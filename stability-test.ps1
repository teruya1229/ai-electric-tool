$ErrorActionPreference = "Stop"

$script:projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputPath = Join-Path $script:projectRoot ".tmp_case_results.json"
$chromeDriverPath = Join-Path $script:projectRoot "chromedriver/chromedriver-win64/chromedriver.exe"
$portCandidates = @(5500, 5501, 5502, 8080)
$port = $null
$baseUrl = $null
$driverPortCandidates = @(9515, 9516, 9517)
$driverPort = $null
$driverBaseUrl = $null
$sessionId = $null
$driverProc = $null
$httpListener = $null
$listenerTask = $null

function Log-Step([string]$step, [string]$phase = "start") {
  Write-Host "[stability-test] step=$step phase=$phase"
}

function Get-ChromeDriverVersion() {
  try {
    $version = (& $chromeDriverPath --version 2>$null | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($version)) { $version = "unknown" }
    Write-Host "[stability-test] chromedriver-version=$version"
    return $version
  } catch {
    Write-Host "[stability-test] chromedriver-version=unavailable error=$($_.Exception.Message)"
    return "unavailable"
  }
}

function Get-ChromeVersion() {
  $candidates = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
  )
  foreach ($path in $candidates) {
    if (Test-Path $path -PathType Leaf) {
      try {
        $v = (Get-Item $path).VersionInfo.FileVersion
        if ([string]::IsNullOrWhiteSpace($v)) { $v = "unknown" }
        Write-Host "[stability-test] chrome-version=$v path=$path"
        return $v
      } catch {
        Write-Host "[stability-test] chrome-version=unavailable path=$path error=$($_.Exception.Message)"
        return "unavailable"
      }
    }
  }
  Write-Host "[stability-test] chrome-version=unavailable reason=chrome-exe-not-found"
  "unavailable"
}

function Log-WebDriverExecuteRequestInfo(
  [string]$scriptLabel,
  [string]$requestUrl,
  [string]$endpointPath,
  [string[]]$payloadKeys,
  [bool]$hasArgs
) {
  $keys = if ($payloadKeys) { ($payloadKeys -join ",") } else { "" }
  Write-Host "[stability-test] wd-exec-request label=$scriptLabel url=$requestUrl endpoint=$endpointPath payloadKeys=$keys hasArgs=$hasArgs"
}

function Get-ContentType([string]$path) {
  switch ([IO.Path]::GetExtension($path).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".json" { "application/json; charset=utf-8" }
    default { "application/octet-stream" }
  }
}

function Get-AvailablePort([int[]]$candidates) {
  foreach ($candidate in $candidates) {
    $probe = $null
    try {
      $probe = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $candidate)
      $probe.Start()
      return $candidate
    } catch {
      Write-Host "[stability-test] port unavailable: $candidate ($($_.Exception.Message))"
    } finally {
      if ($probe) {
        try { $probe.Stop() } catch {}
      }
    }
  }
  $fallback = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
  try {
    $fallback.Start()
    return ([System.Net.IPEndPoint]$fallback.LocalEndpoint).Port
  } finally {
    try { $fallback.Stop() } catch {}
  }
}

function Start-StaticServer {
  if (-not $script:port) {
    throw "Port is not initialized."
  }
  $script:httpListener = [System.Net.HttpListener]::new()
  $script:httpListener.Prefixes.Add("$($script:baseUrl)/")
  try {
    $script:httpListener.Start()
  } catch {
    Write-Host "[stability-test] failed to bind port: $script:port"
    throw
  }
  Write-Host "[stability-test] serving on $($script:baseUrl)"
  $script:listenerTask = [System.Threading.Tasks.Task]::Run([Action]{
    while ($script:httpListener -and $script:httpListener.IsListening) {
      try { $context = $script:httpListener.GetContext() } catch { break }
      try {
        $response = $context.Response
        $cleanPath = $context.Request.Url.AbsolutePath
        $relative = [System.Uri]::UnescapeDataString($cleanPath.TrimStart("/"))
        if ([string]::IsNullOrWhiteSpace($relative)) { $relative = "wiring-diagram.html" }
        $full = [IO.Path]::GetFullPath((Join-Path $script:projectRoot $relative))
        $root = [IO.Path]::GetFullPath($script:projectRoot)
        if ($full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $full -PathType Leaf)) {
          $bytes = [IO.File]::ReadAllBytes($full)
          $response.StatusCode = 200
          $response.ContentType = Get-ContentType $full
          $response.ContentLength64 = $bytes.Length
          $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
          $body = [Text.Encoding]::UTF8.GetBytes("Not Found")
          $response.StatusCode = 404
          $response.ContentType = "text/plain; charset=utf-8"
          $response.ContentLength64 = $body.Length
          $response.OutputStream.Write($body, 0, $body.Length)
        }
        $response.OutputStream.Close()
      } catch {
        try { $context.Response.OutputStream.Close() } catch {}
      }
    }
  })
}

function Stop-StaticServer {
  if ($script:httpListener) {
    try { $script:httpListener.Stop() } catch {}
  }
}

function Wait-ServerReady {
  $until = (Get-Date).AddSeconds(10)
  while ((Get-Date) -lt $until) {
    $client = $null
    try {
      $client = [System.Net.Sockets.TcpClient]::new()
      $client.Connect("127.0.0.1", [int]$script:port)
      if ($client.Connected) { return }
    } catch {
      Start-Sleep -Milliseconds 200
    } finally {
      if ($client) {
        try { $client.Close() } catch {}
      }
    }
    try {
      Invoke-WebRequest -Uri "$baseUrl/wiring-diagram.html" -UseBasicParsing -TimeoutSec 2 | Out-Null
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
  if (-not $script:driverPort) {
    throw "Driver port is not initialized."
  }
  $script:driverProc = Start-Process -FilePath $chromeDriverPath -ArgumentList "--port=$($script:driverPort)" -PassThru
  Write-Host "[stability-test] chromedriver on $($script:driverBaseUrl)"
  $until = (Get-Date).AddSeconds(10)
  while ((Get-Date) -lt $until) {
    try {
      Invoke-RestMethod -Method Get -Uri "$($script:driverBaseUrl)/status" -TimeoutSec 5 | Out-Null
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
        pageLoadStrategy = "none"
        "goog:chromeOptions" = @{
          args = @("--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=1400,2200")
        }
      }
    }
  } | ConvertTo-Json -Depth 8
  $resp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session" -ContentType "application/json" -Body $caps -TimeoutSec 30
  $script:sessionId = if ($resp.value.sessionId) { $resp.value.sessionId } else { $resp.sessionId }
  if (-not $script:sessionId) { throw "Cannot create WebDriver session." }
}

function Remove-Session {
  if ($script:sessionId) {
    try { Invoke-RestMethod -Method Delete -Uri "$($script:driverBaseUrl)/session/$($script:sessionId)" -TimeoutSec 10 | Out-Null } catch {}
  }
}

function Exec-Script([string]$js, [object[]]$args = @(), [string]$scriptLabel = "unlabeled") {
  $payload = @{ script = $js; args = $args }
  $requestUrl = "$($script:driverBaseUrl)/session/$($script:sessionId)/execute/sync"
  Log-WebDriverExecuteRequestInfo $scriptLabel $requestUrl "/session/{id}/execute/sync" @($payload.Keys) ($null -ne $args)
  $body = $payload | ConvertTo-Json -Depth 8
  $resp = Invoke-RestMethod -Method Post -Uri $requestUrl -ContentType "application/json" -Body $body -TimeoutSec 20
  $resp.value
}

function Open-Page {
  $body = @{ url = "$baseUrl/wiring-diagram.html" } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session/$($script:sessionId)/url" -ContentType "application/json" -Body $body -TimeoutSec 20 | Out-Null
}

function Wait-BrowserReady([int]$waitMs = 500) {
  Start-Sleep -Milliseconds $waitMs
}

function Open-PageWithRetry([int]$maxAttempts = 2, [int]$retryWaitMs = 700) {
  $targetUrl = "$baseUrl/wiring-diagram.html"
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    Write-Host "[stability-test] page-open sessionIdPresent=$([bool]$script:sessionId) target=$targetUrl attempt=$attempt/$maxAttempts"
    try {
      Open-Page
      return
    } catch {
      Write-Host "[stability-test] page-open failed attempt=$attempt message=$($_.Exception.Message)"
      if ($attempt -ge $maxAttempts) { break }
      Write-Host "[stability-test] page-open recreate session before retry"
      try { Remove-Session } catch {}
      New-Session
      Wait-BrowserReady
      Start-Sleep -Milliseconds $retryWaitMs
    }
  }
  Write-Host "[stability-test] page-open fallback via execute/sync target=$targetUrl"
  Exec-Script "window.location.href = arguments[0]; return true;" @($targetUrl) | Out-Null
  $navigated = Wait-Until {
    [bool](Exec-Script "return location.href.indexOf('wiring-diagram.html') >= 0;")
  } 10
  if (-not $navigated) {
    throw "Page open fallback did not reach target URL."
  }
}

function Invoke-WebDriverExecuteWithFallback(
  [string]$label,
  [string]$scriptText,
  [object[]]$args = @(),
  [int]$maxAttempts = 2,
  [int]$retryWaitMs = 300
) {
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    Write-Host "[stability-test] wd-exec label=$label attempt=$attempt/$maxAttempts phase=start"
    try {
      $value = Exec-Script $scriptText $args $label
      Write-Host "[stability-test] wd-exec label=$label attempt=$attempt/$maxAttempts phase=success"
      return [ordered]@{ ok = $true; value = $value; error = "" }
    } catch {
      $message = $_.Exception.Message
      Write-Host "[stability-test] wd-exec label=$label attempt=$attempt/$maxAttempts phase=fail error=$message"
      if ($attempt -ge $maxAttempts) {
        return [ordered]@{ ok = $false; value = $null; error = $message }
      }
      Start-Sleep -Milliseconds $retryWaitMs
    }
  }
}

function Test-WebDriverExecutionLayer() {
  $probes = @(
    @{ label = "const-1"; script = "return 1;" },
    @{ label = "ready-state"; script = "return document.readyState;" },
    @{ label = "href"; script = "return location.href;" },
    @{ label = "has-body"; script = "return !!document.body;" }
  )
  $results = @()
  foreach ($probe in $probes) {
    $result = Invoke-WebDriverExecuteWithFallback $probe.label $probe.script
    $results += [ordered]@{
      label = $probe.label
      ok = [bool]$result.ok
      value = $result.value
      error = $result.error
    }
    if (-not $result.ok) {
      break
    }
  }
  $first = if ($results.Count -gt 0) { $results[0] } else { $null }
  $executeLayerDead = ($first -and -not $first.ok)
  [ordered]@{
    ok = (-not ($results | Where-Object { -not $_.ok }))
    executeLayerDead = [bool]$executeLayerDead
    results = $results
  }
}

function Get-UiInitDiagnostics() {
  try {
    Exec-Script @'
const byId = (id) => document.getElementById(id);
const panel = byId("parseResultPanel");
const bodyText = (document.body && document.body.innerText ? document.body.innerText : "").replace(/\s+/g, " ").slice(0, 120);
return {
  readyState: document.readyState || "",
  href: (location && location.href) || "",
  title: document.title || "",
  hasBody: !!document.body,
  hasProblemTextInput: !!byId("problemTextInput"),
  hasParseProblemButton: !!byId("parseProblemButton"),
  hasParseResultPanel: !!panel,
  hasParseResultPre: !!(panel && panel.querySelector("pre")),
  bodyPreview: bodyText
};
'@
  } catch {
    [ordered]@{
      readyState = "exec-error"
      href = ""
      title = ""
      hasBody = $false
      hasProblemTextInput = $false
      hasParseProblemButton = $false
      hasParseResultPanel = $false
      hasParseResultPre = $false
      bodyPreview = ""
      error = $_.Exception.Message
    }
  }
}

function Wait-UiInitWithDiagnostics([int]$timeoutSec = 40, [int]$intervalMs = 800) {
  $until = (Get-Date).AddSeconds($timeoutSec)
  $last = $null
  while ((Get-Date) -lt $until) {
    $d = Get-UiInitDiagnostics
    $last = $d
    Write-Host "[stability-test] ui-init readyState=$($d.readyState) input=$($d.hasProblemTextInput) button=$($d.hasParseProblemButton) panel=$($d.hasParseResultPanel) pre=$($d.hasParseResultPre) url=$($d.href)"
    if (($d.readyState -eq "interactive" -or $d.readyState -eq "complete") -and $d.hasProblemTextInput -and $d.hasParseProblemButton -and $d.hasParseResultPanel -and $d.hasParseResultPre) {
      return @{ ok = $true; last = $d }
    }
    Start-Sleep -Milliseconds $intervalMs
  }
  Write-Host "[stability-test] ui-init timeout last readyState=$($last.readyState) input=$($last.hasProblemTextInput) button=$($last.hasParseProblemButton) panel=$($last.hasParseResultPanel) pre=$($last.hasParseResultPre) url=$($last.href) title=$($last.title) body='$($last.bodyPreview)' error=$($last.error)"
  @{ ok = $false; last = $last }
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
  Log-Step "parse click" "start"
  $setAndClick = @(
    'window.__parserEntryLogs = [];'
    'if (!window.__parserEntryPatched) {'
    '  const orig = console.info.bind(console);'
    '  console.info = (...args) => {'
    '    try {'
    '      const msg = args.map((v) => typeof v === "string" ? v : JSON.stringify(v)).join(" ");'
    '      if (msg.includes("[problem-parser] input length:") || msg.includes("[problem-parser] input preview:")) {'
    '        window.__parserEntryLogs.push(msg);'
    '      }'
    '    } catch (_) {}'
    '    return orig(...args);'
    '  };'
    '  window.__parserEntryPatched = true;'
    '}'
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
  Log-Step "parse click" "done"

  Log-Step "result wait" "start"
  $parseReady = Wait-Until {
    $waitScript = @(
      'const pre = document.querySelector("#parseResultPanel pre");'
      'if (!pre) return false;'
      'const t = (pre.textContent || "").trim();'
      'const b = window.__testBeforeParse || "";'
      'return t.length > 0 && t !== b;'
    ) -join "`n"
    try {
      [bool](Exec-Script $waitScript)
    } catch {
      Write-Host "[stability-test] result wait probe timeout: $($_.Exception.Message)"
      $false
    }
  } 20
  Log-Step "result wait" "done"

  $snapshotScript = @(
    'const txt = (id) => { const e = document.getElementById(id); return e ? (e.textContent || "").trim() : ""; };'
    'const parse = (() => { const p = document.querySelector("#parseResultPanel pre"); return p ? (p.textContent || "").trim() : ""; })();'
    'return {'
    '  parseText: parse,'
    '  parserEntryLogs: Array.isArray(window.__parserEntryLogs) ? window.__parserEntryLogs.slice() : [],'
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

  $result = [ordered]@{
    input = $inputText
    parseReady = $parseReady
    status = if ($failed.Count -eq 0) { "OK" } else { "要修正" }
    failedChecks = $failed
    checks = $checks
    parseText = $snap.parseText
    parserEntryLogs = $snap.parserEntryLogs
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
  Log-Step "case end" "done"
  $result
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
  Get-ChromeDriverVersion | Out-Null
  Get-ChromeVersion | Out-Null
  Log-Step "port detect" "start"
  $script:port = Get-AvailablePort $portCandidates
  $script:baseUrl = "http://127.0.0.1:$($script:port)"
  $script:driverPort = Get-AvailablePort $driverPortCandidates
  $script:driverBaseUrl = "http://127.0.0.1:$($script:driverPort)"
  Log-Step "port detect" "done"
  Log-Step "server start" "start"
  Start-StaticServer
  Log-Step "server start" "done"
  Log-Step "wait start" "start"
  Wait-ServerReady
  Log-Step "wait start" "done"
  Log-Step "browser launch" "start"
  Start-Driver
  Log-Step "browser launch" "done"
  Log-Step "browser launch(session)" "start"
  New-Session
  Log-Step "browser launch(session)" "done"
  Wait-BrowserReady
  Log-Step "page open" "start"
  Open-PageWithRetry
  Log-Step "page open" "done"

  Log-Step "webdriver execute probe" "start"
  $wdProbe = Test-WebDriverExecutionLayer
  Log-Step "webdriver execute probe" "done"
  if (-not $wdProbe.ok) {
    $firstFail = $wdProbe.results | Where-Object { -not $_.ok } | Select-Object -First 1
    if ($wdProbe.executeLayerDead) {
      Write-Host "[stability-test] webdriver execute layer dead before ui-init label=$($firstFail.label) error=$($firstFail.error)"
      throw "WebDriver execute layer is unavailable before ui init."
    }
    Write-Host "[stability-test] webdriver execute probe failed at label=$($firstFail.label) error=$($firstFail.error)"
    throw "WebDriver execute probe failed before ui init."
  }

  Log-Step "wait start(ui init)" "start"
  $uiInit = Wait-UiInitWithDiagnostics 40 800
  $initialized = [bool]$uiInit.ok
  if (-not $initialized) {
    Write-Host "[stability-test] ui init retry after page-open"
    Wait-BrowserReady 700
    Open-PageWithRetry
    $uiInit = Wait-UiInitWithDiagnostics 40 800
    $initialized = [bool]$uiInit.ok
  }
  Log-Step "wait start(ui init)" "done"
  if (-not $initialized) { throw "UI init timeout." }

  $results = @()
  foreach ($case in $cases) {
    Log-Step "case $($case.name)" "start"
    $caseResult = Run-Case $case.input
    $results += [ordered]@{
      case = $case.name
      input = $caseResult.input
      parseReady = $caseResult.parseReady
      status = $caseResult.status
      failedChecks = $caseResult.failedChecks
      checks = $caseResult.checks
      parseText = $caseResult.parseText
      parserEntryLogs = $caseResult.parserEntryLogs
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
    Log-Step "case $($case.name)" "done"
  }

  [IO.File]::WriteAllText($outputPath, ($results | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
  Write-Host "Saved test results to $outputPath"
  $results | ForEach-Object { Write-Host ("[{0}] {1}" -f $_.status, $_.case) }
}
finally {
  Log-Step "finally cleanup" "start"
  Remove-Session
  Stop-Driver
  Stop-StaticServer
  Log-Step "finally cleanup" "done"
}
