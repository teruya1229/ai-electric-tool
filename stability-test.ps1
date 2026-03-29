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
$skipDiagnosticsForE2E = $true
$sessionId = $null
$driverProc = $null
$httpListener = $null
$listenerTask = $null
$curlProbeBodyPath = $null
$curlProbeTracePath = $null
$chromeDriverLogPath = $null
$script:runStartedAt = (Get-Date).ToString("o")
$script:sourceCommit = $null
$script:selfPath = $MyInvocation.MyCommand.Path
$script:repeatSummaryPath = Join-Path $script:projectRoot ".tmp_case_results_repeat.json"
$script:compareSummaryPath = Join-Path $script:projectRoot ".tmp_case_results_compare.json"

if ((-not $env:STABILITY_REPEAT_CHILD) -and ($env:STABILITY_COMPARE_NAV_MODES -eq "1")) {
  function Get-ComparePreUiSnapshot() {
    if (-not (Test-Path $outputPath -PathType Leaf)) { return $null }
    try {
      $raw = Get-Content -Raw -Path $outputPath
      if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
      $runType = $null
      $webdriverError = $null
      $webdriverError1 = $null
      $webdriverError2 = $null
      $hrefBeforeUiInit = $null
      $navigateAttempted = $false
      $navigateHttpStatus = $null
      $navigateErrorClass = $null

      if ($raw -match '"runType"\s*:\s*"([^"]*)"') { $runType = [string]$Matches[1] }

      if ($raw -match '"webdriverError"\s*:\s*(null|"([^"]*)")') {
        if ($Matches[1] -ne "null") { $webdriverError = [string]$Matches[2] }
      }
      if ($raw -match '"webdriverError1"\s*:\s*(null|"([^"]*)")') {
        if ($Matches[1] -ne "null") { $webdriverError1 = [string]$Matches[2] }
      }
      if ($raw -match '"webdriverError2"\s*:\s*(null|"([^"]*)")') {
        if ($Matches[1] -ne "null") { $webdriverError2 = [string]$Matches[2] }
      }
      if ($raw -match '"hrefBeforeUiInit"\s*:\s*(null|"([^"]*)")') {
        if ($Matches[1] -ne "null") { $hrefBeforeUiInit = [string]$Matches[2] }
      }
      if ($raw -match '"navigateAttempted"\s*:\s*(true|false)') { $navigateAttempted = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"navigateHttpStatus"\s*:\s*(null|-?\d+)') {
        if ($Matches[1] -ne "null") { $navigateHttpStatus = [int]$Matches[1] }
      }
      if ($raw -match '"navigateErrorClass"\s*:\s*(null|"([^"]*)")') {
        if ($Matches[1] -ne "null") { $navigateErrorClass = [string]$Matches[2] }
      }

      return [ordered]@{
        runType = $runType
        webdriverError = $webdriverError
        webdriverError1 = $webdriverError1
        webdriverError2 = $webdriverError2
        hrefBeforeUiInit = $hrefBeforeUiInit
        navigateAttempted = $navigateAttempted
        navigateHttpStatus = $navigateHttpStatus
        navigateErrorClass = $navigateErrorClass
      }
    } catch {
      return $null
    }
  }

  function Invoke-CompareChildRun([bool]$skipNavigate) {
    if ($skipNavigate) {
      $env:STABILITY_COMPARE_SKIP_NAVIGATE = "1"
    } else {
      Remove-Item Env:STABILITY_COMPARE_SKIP_NAVIGATE -ErrorAction SilentlyContinue
    }
    $env:STABILITY_REPEAT_CHILD = "1"
    $env:STABILITY_COMPARE_CHILD = "1"
    try {
      & powershell -ExecutionPolicy Bypass -File $script:selfPath | Out-Null
    } catch {}
    $exitCode = $LASTEXITCODE
    $diag = $null
    for ($attempt = 1; $attempt -le 10; $attempt++) {
      $diag = Get-ComparePreUiSnapshot
      if ($diag) { break }
      Start-Sleep -Milliseconds 200
    }
    return [ordered]@{
      skipNavigate = $skipNavigate
      exitCode = $exitCode
      diagnostic = $diag
    }
  }

  Write-Host "[stability-test] compare-run start axis=navigate with/without"
  $withNavigate = Invoke-CompareChildRun $false
  $withoutNavigate = Invoke-CompareChildRun $true
  $withDiag = $withNavigate.diagnostic
  $withoutDiag = $withoutNavigate.diagnostic
  $diffSummary = [ordered]@{
    runTypeChanged = ([string]$withDiag.runType -ne [string]$withoutDiag.runType)
    webdriverErrorChanged = ([string]$withDiag.webdriverError -ne [string]$withoutDiag.webdriverError)
    webdriverError1Changed = ([string]$withDiag.webdriverError1 -ne [string]$withoutDiag.webdriverError1)
    webdriverError2Changed = ([string]$withDiag.webdriverError2 -ne [string]$withoutDiag.webdriverError2)
    hrefBeforeUiInitChanged = ([string]$withDiag.hrefBeforeUiInit -ne [string]$withoutDiag.hrefBeforeUiInit)
    navigateErrorClassChanged = ([string]$withDiag.navigateErrorClass -ne [string]$withoutDiag.navigateErrorClass)
    withNavigateAttempted = if ($null -ne $withDiag) { [bool]$withDiag.navigateAttempted } else { $false }
    withoutNavigateAttempted = if ($null -ne $withoutDiag) { [bool]$withoutDiag.navigateAttempted } else { $false }
  }
  $compareSummary = [ordered]@{
    comparedAt = (Get-Date).ToString("o")
    withNavigate = $withNavigate
    withoutNavigate = $withoutNavigate
    diffSummary = $diffSummary
  }
  ($compareSummary | ConvertTo-Json -Depth 10) | Set-Content -Path $script:compareSummaryPath -Encoding UTF8
  Write-Host "[stability-test] compare-run summary written path=$script:compareSummaryPath"
  Remove-Item Env:STABILITY_REPEAT_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_SKIP_NAVIGATE -ErrorAction SilentlyContinue
  return
}

if ((-not $env:STABILITY_REPEAT_CHILD) -and ($env:STABILITY_COMPARE_EXECUTE_MODES -eq "1")) {
  function Get-ComparePreUiSnapshotForExecute() {
    if (-not (Test-Path $outputPath -PathType Leaf)) { return $null }
    try {
      $raw = Get-Content -Raw -Path $outputPath
      if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
      $runType = $null
      $webdriverError = $null
      $webdriverError1 = $null
      $webdriverError2 = $null
      $hrefBeforeUiInit = $null
      $executeAttempted = $false
      $executeSucceeded = $false
      $executeResult = $null
      $executeErrorClass = $null

      if ($raw -match '"runType"\s*:\s*"([^"]*)"') { $runType = [string]$Matches[1] }
      if ($raw -match '"webdriverError"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError = [string]$Matches[2] } }
      if ($raw -match '"webdriverError1"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError1 = [string]$Matches[2] } }
      if ($raw -match '"webdriverError2"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError2 = [string]$Matches[2] } }
      if ($raw -match '"hrefBeforeUiInit"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $hrefBeforeUiInit = [string]$Matches[2] } }
      if ($raw -match '"executeAttempted"\s*:\s*(true|false)') { $executeAttempted = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"executeSucceeded"\s*:\s*(true|false)') { $executeSucceeded = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"executeResult"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $executeResult = [string]$Matches[2] } }
      if ($raw -match '"executeErrorClass"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $executeErrorClass = [string]$Matches[2] } }

      return [ordered]@{
        runType = $runType
        webdriverError = $webdriverError
        webdriverError1 = $webdriverError1
        webdriverError2 = $webdriverError2
        hrefBeforeUiInit = $hrefBeforeUiInit
        executeAttempted = $executeAttempted
        executeSucceeded = $executeSucceeded
        executeResult = $executeResult
        executeErrorClass = $executeErrorClass
      }
    } catch {
      return $null
    }
  }

  function Invoke-CompareExecuteChildRun([bool]$withExecute) {
    if ($withExecute) {
      $env:STABILITY_COMPARE_WITH_EXECUTE = "1"
    } else {
      Remove-Item Env:STABILITY_COMPARE_WITH_EXECUTE -ErrorAction SilentlyContinue
    }
    $env:STABILITY_REPEAT_CHILD = "1"
    $env:STABILITY_COMPARE_CHILD = "1"
    try {
      & powershell -ExecutionPolicy Bypass -File $script:selfPath | Out-Null
    } catch {}
    $exitCode = $LASTEXITCODE
    $diag = $null
    for ($attempt = 1; $attempt -le 10; $attempt++) {
      $diag = Get-ComparePreUiSnapshotForExecute
      if ($diag) { break }
      Start-Sleep -Milliseconds 200
    }
    return [ordered]@{
      withExecute = $withExecute
      exitCode = $exitCode
      diagnostic = $diag
    }
  }

  Write-Host "[stability-test] compare-run start axis=minimal-execute with/without"
  $withExecute = Invoke-CompareExecuteChildRun $true
  $withoutExecute = Invoke-CompareExecuteChildRun $false
  $withDiag = $withExecute.diagnostic
  $withoutDiag = $withoutExecute.diagnostic
  $diffSummary = [ordered]@{
    runTypeChanged = ([string]$withDiag.runType -ne [string]$withoutDiag.runType)
    webdriverErrorChanged = ([string]$withDiag.webdriverError -ne [string]$withoutDiag.webdriverError)
    webdriverError1Changed = ([string]$withDiag.webdriverError1 -ne [string]$withoutDiag.webdriverError1)
    webdriverError2Changed = ([string]$withDiag.webdriverError2 -ne [string]$withoutDiag.webdriverError2)
    hrefBeforeUiInitChanged = ([string]$withDiag.hrefBeforeUiInit -ne [string]$withoutDiag.hrefBeforeUiInit)
    executeErrorClassChanged = ([string]$withDiag.executeErrorClass -ne [string]$withoutDiag.executeErrorClass)
    withExecuteAttempted = if ($null -ne $withDiag) { [bool]$withDiag.executeAttempted } else { $false }
    withoutExecuteAttempted = if ($null -ne $withoutDiag) { [bool]$withoutDiag.executeAttempted } else { $false }
  }
  $compareSummary = [ordered]@{
    comparedAt = (Get-Date).ToString("o")
    withExecute = $withExecute
    withoutExecute = $withoutExecute
    diffSummary = $diffSummary
  }
  ($compareSummary | ConvertTo-Json -Depth 10) | Set-Content -Path $script:compareSummaryPath -Encoding UTF8
  Write-Host "[stability-test] compare-run summary written path=$script:compareSummaryPath"
  Remove-Item Env:STABILITY_REPEAT_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_WITH_EXECUTE -ErrorAction SilentlyContinue
  return
}

if ((-not $env:STABILITY_REPEAT_CHILD) -and ($env:STABILITY_COMPARE_WINDOW_MODES -eq "1")) {
  function Get-ComparePreUiSnapshotForWindow() {
    if (-not (Test-Path $outputPath -PathType Leaf)) { return $null }
    try {
      $raw = Get-Content -Raw -Path $outputPath
      if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
      $runType = $null
      $webdriverError = $null
      $webdriverError1 = $null
      $webdriverError2 = $null
      $hrefBeforeUiInit = $null
      $windowProbeAttempted = $false
      $currentWindowHandleSucceeded = $false
      $currentWindowHandleErrorClass = $null
      $windowHandlesSucceeded = $false
      $windowHandlesCount = $null
      $windowHandlesErrorClass = $null

      if ($raw -match '"runType"\s*:\s*"([^"]*)"') { $runType = [string]$Matches[1] }
      if ($raw -match '"webdriverError"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError = [string]$Matches[2] } }
      if ($raw -match '"webdriverError1"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError1 = [string]$Matches[2] } }
      if ($raw -match '"webdriverError2"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError2 = [string]$Matches[2] } }
      if ($raw -match '"hrefBeforeUiInit"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $hrefBeforeUiInit = [string]$Matches[2] } }
      if ($raw -match '"windowProbeAttempted"\s*:\s*(true|false)') { $windowProbeAttempted = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"currentWindowHandleSucceeded"\s*:\s*(true|false)') { $currentWindowHandleSucceeded = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"currentWindowHandleErrorClass"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $currentWindowHandleErrorClass = [string]$Matches[2] } }
      if ($raw -match '"windowHandlesSucceeded"\s*:\s*(true|false)') { $windowHandlesSucceeded = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"windowHandlesCount"\s*:\s*(null|-?\d+)') { if ($Matches[1] -ne "null") { $windowHandlesCount = [int]$Matches[1] } }
      if ($raw -match '"windowHandlesErrorClass"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $windowHandlesErrorClass = [string]$Matches[2] } }

      return [ordered]@{
        runType = $runType
        webdriverError = $webdriverError
        webdriverError1 = $webdriverError1
        webdriverError2 = $webdriverError2
        hrefBeforeUiInit = $hrefBeforeUiInit
        windowProbeAttempted = $windowProbeAttempted
        currentWindowHandleSucceeded = $currentWindowHandleSucceeded
        currentWindowHandleErrorClass = $currentWindowHandleErrorClass
        windowHandlesSucceeded = $windowHandlesSucceeded
        windowHandlesCount = $windowHandlesCount
        windowHandlesErrorClass = $windowHandlesErrorClass
      }
    } catch {
      return $null
    }
  }

  function Invoke-CompareWindowChildRun([bool]$withWindowProbe) {
    if ($withWindowProbe) {
      $env:STABILITY_COMPARE_WITH_WINDOW_PROBE = "1"
    } else {
      Remove-Item Env:STABILITY_COMPARE_WITH_WINDOW_PROBE -ErrorAction SilentlyContinue
    }
    $env:STABILITY_REPEAT_CHILD = "1"
    $env:STABILITY_COMPARE_CHILD = "1"
    try {
      & powershell -ExecutionPolicy Bypass -File $script:selfPath | Out-Null
    } catch {}
    $exitCode = $LASTEXITCODE
    $diag = $null
    for ($attempt = 1; $attempt -le 10; $attempt++) {
      $diag = Get-ComparePreUiSnapshotForWindow
      if ($diag) { break }
      Start-Sleep -Milliseconds 200
    }
    return [ordered]@{
      withWindowProbe = $withWindowProbe
      exitCode = $exitCode
      diagnostic = $diag
    }
  }

  Write-Host "[stability-test] compare-run start axis=window-handle-probe with/without"
  $withWindowProbe = Invoke-CompareWindowChildRun $true
  $withoutWindowProbe = Invoke-CompareWindowChildRun $false
  $withDiag = $withWindowProbe.diagnostic
  $withoutDiag = $withoutWindowProbe.diagnostic
  $diffSummary = [ordered]@{
    runTypeChanged = ([string]$withDiag.runType -ne [string]$withoutDiag.runType)
    webdriverErrorChanged = ([string]$withDiag.webdriverError -ne [string]$withoutDiag.webdriverError)
    webdriverError1Changed = ([string]$withDiag.webdriverError1 -ne [string]$withoutDiag.webdriverError1)
    webdriverError2Changed = ([string]$withDiag.webdriverError2 -ne [string]$withoutDiag.webdriverError2)
    hrefBeforeUiInitChanged = ([string]$withDiag.hrefBeforeUiInit -ne [string]$withoutDiag.hrefBeforeUiInit)
    currentWindowHandleErrorClassChanged = ([string]$withDiag.currentWindowHandleErrorClass -ne [string]$withoutDiag.currentWindowHandleErrorClass)
    windowHandlesCountChanged = ([string]$withDiag.windowHandlesCount -ne [string]$withoutDiag.windowHandlesCount)
    windowHandlesErrorClassChanged = ([string]$withDiag.windowHandlesErrorClass -ne [string]$withoutDiag.windowHandlesErrorClass)
    withWindowProbeAttempted = if ($null -ne $withDiag) { [bool]$withDiag.windowProbeAttempted } else { $false }
    withoutWindowProbeAttempted = if ($null -ne $withoutDiag) { [bool]$withoutDiag.windowProbeAttempted } else { $false }
  }
  $compareSummary = [ordered]@{
    comparedAt = (Get-Date).ToString("o")
    withWindowProbe = $withWindowProbe
    withoutWindowProbe = $withoutWindowProbe
    diffSummary = $diffSummary
  }
  ($compareSummary | ConvertTo-Json -Depth 10) | Set-Content -Path $script:compareSummaryPath -Encoding UTF8
  Write-Host "[stability-test] compare-run summary written path=$script:compareSummaryPath"
  Remove-Item Env:STABILITY_REPEAT_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_WITH_WINDOW_PROBE -ErrorAction SilentlyContinue
  return
}

if ((-not $env:STABILITY_REPEAT_CHILD) -and ($env:STABILITY_COMPARE_CURRENT_WINDOW_MODES -eq "1")) {
  function Get-ComparePreUiSnapshotForCurrentWindow() {
    if (-not (Test-Path $outputPath -PathType Leaf)) { return $null }
    try {
      $raw = Get-Content -Raw -Path $outputPath
      if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
      $runType = $null
      $webdriverError = $null
      $webdriverError1 = $null
      $webdriverError2 = $null
      $hrefBeforeUiInit = $null
      $currentWindowProbeAttempted = $false
      $currentWindowHandleSucceeded = $false
      $currentWindowHandleErrorClass = $null

      if ($raw -match '"runType"\s*:\s*"([^"]*)"') { $runType = [string]$Matches[1] }
      if ($raw -match '"webdriverError"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError = [string]$Matches[2] } }
      if ($raw -match '"webdriverError1"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError1 = [string]$Matches[2] } }
      if ($raw -match '"webdriverError2"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError2 = [string]$Matches[2] } }
      if ($raw -match '"hrefBeforeUiInit"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $hrefBeforeUiInit = [string]$Matches[2] } }
      if ($raw -match '"currentWindowProbeAttempted"\s*:\s*(true|false)') { $currentWindowProbeAttempted = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"currentWindowHandleSucceeded"\s*:\s*(true|false)') { $currentWindowHandleSucceeded = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"currentWindowHandleErrorClass"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $currentWindowHandleErrorClass = [string]$Matches[2] } }

      return [ordered]@{
        runType = $runType
        webdriverError = $webdriverError
        webdriverError1 = $webdriverError1
        webdriverError2 = $webdriverError2
        hrefBeforeUiInit = $hrefBeforeUiInit
        currentWindowProbeAttempted = $currentWindowProbeAttempted
        currentWindowHandleSucceeded = $currentWindowHandleSucceeded
        currentWindowHandleErrorClass = $currentWindowHandleErrorClass
      }
    } catch {
      return $null
    }
  }

  function Invoke-CompareCurrentWindowChildRun([bool]$withCurrentWindowProbe) {
    if ($withCurrentWindowProbe) {
      $env:STABILITY_COMPARE_WITH_CURRENT_WINDOW_PROBE = "1"
    } else {
      Remove-Item Env:STABILITY_COMPARE_WITH_CURRENT_WINDOW_PROBE -ErrorAction SilentlyContinue
    }
    $env:STABILITY_REPEAT_CHILD = "1"
    $env:STABILITY_COMPARE_CHILD = "1"
    try {
      & powershell -ExecutionPolicy Bypass -File $script:selfPath | Out-Null
    } catch {}
    $exitCode = $LASTEXITCODE
    $diag = $null
    for ($attempt = 1; $attempt -le 10; $attempt++) {
      $diag = Get-ComparePreUiSnapshotForCurrentWindow
      if ($diag) { break }
      Start-Sleep -Milliseconds 200
    }
    return [ordered]@{
      withCurrentWindowProbe = $withCurrentWindowProbe
      exitCode = $exitCode
      diagnostic = $diag
    }
  }

  Write-Host "[stability-test] compare-run start axis=current-window-handle with/without"
  $withCurrentWindowProbe = Invoke-CompareCurrentWindowChildRun $true
  $withoutCurrentWindowProbe = Invoke-CompareCurrentWindowChildRun $false
  $withDiag = $withCurrentWindowProbe.diagnostic
  $withoutDiag = $withoutCurrentWindowProbe.diagnostic
  $diffSummary = [ordered]@{
    runTypeChanged = ([string]$withDiag.runType -ne [string]$withoutDiag.runType)
    webdriverErrorChanged = ([string]$withDiag.webdriverError -ne [string]$withoutDiag.webdriverError)
    webdriverError1Changed = ([string]$withDiag.webdriverError1 -ne [string]$withoutDiag.webdriverError1)
    webdriverError2Changed = ([string]$withDiag.webdriverError2 -ne [string]$withoutDiag.webdriverError2)
    hrefBeforeUiInitChanged = ([string]$withDiag.hrefBeforeUiInit -ne [string]$withoutDiag.hrefBeforeUiInit)
    currentWindowHandleSucceededChanged = ([string]$withDiag.currentWindowHandleSucceeded -ne [string]$withoutDiag.currentWindowHandleSucceeded)
    currentWindowHandleErrorClassChanged = ([string]$withDiag.currentWindowHandleErrorClass -ne [string]$withoutDiag.currentWindowHandleErrorClass)
    withCurrentWindowProbeAttempted = if ($null -ne $withDiag) { [bool]$withDiag.currentWindowProbeAttempted } else { $false }
    withoutCurrentWindowProbeAttempted = if ($null -ne $withoutDiag) { [bool]$withoutDiag.currentWindowProbeAttempted } else { $false }
  }
  $compareSummary = [ordered]@{
    comparedAt = (Get-Date).ToString("o")
    withCurrentWindowProbe = $withCurrentWindowProbe
    withoutCurrentWindowProbe = $withoutCurrentWindowProbe
    diffSummary = $diffSummary
  }
  ($compareSummary | ConvertTo-Json -Depth 10) | Set-Content -Path $script:compareSummaryPath -Encoding UTF8
  Write-Host "[stability-test] compare-run summary written path=$script:compareSummaryPath"
  Remove-Item Env:STABILITY_REPEAT_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_WITH_CURRENT_WINDOW_PROBE -ErrorAction SilentlyContinue
  return
}

if ((-not $env:STABILITY_REPEAT_CHILD) -and ($env:STABILITY_COMPARE_WINDOW_HANDLES_MODES -eq "1")) {
  function Get-ComparePreUiSnapshotForWindowHandles() {
    if (-not (Test-Path $outputPath -PathType Leaf)) { return $null }
    try {
      $raw = Get-Content -Raw -Path $outputPath
      if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
      $json = $null
      try { $json = $raw | ConvertFrom-Json -Depth 20 } catch {}
      $diag = $null
      if ($json -and $json.preUiInitDiagnostic) { $diag = $json.preUiInitDiagnostic }
      $runType = $null
      $webdriverError = $null
      $webdriverError1 = $null
      $webdriverError2 = $null
      $hrefBeforeUiInit = $null
      $windowHandlesProbeAttempted = $false
      $windowHandlesSucceeded = $false
      $windowHandlesCount = $null
      $windowHandlesErrorClass = $null
      $compareWithWindowHandlesProbe = $false
      $runWindowHandlesProbe = $false
      $windowHandlesTimingProbeControlled = $false
      $compareWithWindowHandlesProbeEnv = $null
      $windowHandlesDelayMs = 0

      if ($diag) {
        if ($null -ne $diag.runType) { $runType = [string]$diag.runType }
        if ($null -ne $diag.webdriverError) { $webdriverError = [string]$diag.webdriverError }
        if ($null -ne $diag.webdriverError1) { $webdriverError1 = [string]$diag.webdriverError1 }
        if ($null -ne $diag.webdriverError2) { $webdriverError2 = [string]$diag.webdriverError2 }
        if ($null -ne $diag.hrefBeforeUiInit) { $hrefBeforeUiInit = [string]$diag.hrefBeforeUiInit }
        if ($null -ne $diag.windowHandlesProbeAttempted) { $windowHandlesProbeAttempted = [bool]$diag.windowHandlesProbeAttempted }
        if ($null -ne $diag.windowHandlesSucceeded) { $windowHandlesSucceeded = [bool]$diag.windowHandlesSucceeded }
        if ($null -ne $diag.windowHandlesCount) { $windowHandlesCount = [int]$diag.windowHandlesCount }
        if ($null -ne $diag.windowHandlesErrorClass) { $windowHandlesErrorClass = [string]$diag.windowHandlesErrorClass }
        if ($null -ne $diag.compareWithWindowHandlesProbe) { $compareWithWindowHandlesProbe = [bool]$diag.compareWithWindowHandlesProbe }
        if ($null -ne $diag.runWindowHandlesProbe) { $runWindowHandlesProbe = [bool]$diag.runWindowHandlesProbe }
        if ($null -ne $diag.windowHandlesTimingProbeControlled) { $windowHandlesTimingProbeControlled = [bool]$diag.windowHandlesTimingProbeControlled }
        if ($null -ne $diag.compareWithWindowHandlesProbeEnv) { $compareWithWindowHandlesProbeEnv = [string]$diag.compareWithWindowHandlesProbeEnv }
        if ($null -ne $diag.windowHandlesDelayMs) { $windowHandlesDelayMs = [int]$diag.windowHandlesDelayMs }
      } else {
        if ($raw -match '"runType"\s*:\s*"([^"]*)"') { $runType = [string]$Matches[1] }
        if ($raw -match '"webdriverError"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError = [string]$Matches[2] } }
        if ($raw -match '"webdriverError1"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError1 = [string]$Matches[2] } }
        if ($raw -match '"webdriverError2"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError2 = [string]$Matches[2] } }
        if ($raw -match '"hrefBeforeUiInit"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $hrefBeforeUiInit = [string]$Matches[2] } }
        if ($raw -match '"windowHandlesProbeAttempted"\s*:\s*(true|false)') { $windowHandlesProbeAttempted = ([string]$Matches[1] -eq "true") }
        if ($raw -match '"windowHandlesSucceeded"\s*:\s*(true|false)') { $windowHandlesSucceeded = ([string]$Matches[1] -eq "true") }
        if ($raw -match '"windowHandlesCount"\s*:\s*(null|-?\d+)') { if ($Matches[1] -ne "null") { $windowHandlesCount = [int]$Matches[1] } }
        if ($raw -match '"windowHandlesErrorClass"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $windowHandlesErrorClass = [string]$Matches[2] } }
      }

      $readState = if ($null -ne $json -and $null -ne $json.preUiInitDiagnostic) { "ok" } elseif ($null -ne $json) { "no-preUiInitDiagnostic" } else { "json-parse-failed" }
      return [ordered]@{
        runType = $runType
        webdriverError = $webdriverError
        webdriverError1 = $webdriverError1
        webdriverError2 = $webdriverError2
        hrefBeforeUiInit = $hrefBeforeUiInit
        windowHandlesProbeAttempted = $windowHandlesProbeAttempted
        windowHandlesSucceeded = $windowHandlesSucceeded
        windowHandlesCount = $windowHandlesCount
        windowHandlesErrorClass = $windowHandlesErrorClass
        compareWithWindowHandlesProbe = $compareWithWindowHandlesProbe
        runWindowHandlesProbe = $runWindowHandlesProbe
        windowHandlesTimingProbeControlled = $windowHandlesTimingProbeControlled
        compareWithWindowHandlesProbeEnv = $compareWithWindowHandlesProbeEnv
        windowHandlesDelayMs = $windowHandlesDelayMs
        diagnosticReadState = $readState
      }
    } catch {
      return $null
    }
  }

  function Invoke-CompareWindowHandlesChildRun([bool]$withWindowHandlesProbe) {
    if ($withWindowHandlesProbe) {
      $env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE = "1"
    } else {
      Remove-Item Env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE -ErrorAction SilentlyContinue
    }
    $env:STABILITY_REPEAT_CHILD = "1"
    $env:STABILITY_COMPARE_CHILD = "1"
    try { Remove-Item $outputPath -Force -ErrorAction SilentlyContinue } catch {}
    try {
      & powershell -ExecutionPolicy Bypass -File $script:selfPath | Out-Null
    } catch {}
    $exitCode = $LASTEXITCODE
    $diag = $null
    for ($attempt = 1; $attempt -le 50; $attempt++) {
      $diag = Get-ComparePreUiSnapshotForWindowHandles
      if ($diag) { break }
      Start-Sleep -Milliseconds 200
    }
    if (-not $diag) {
      $readState = "missing"
      if (Test-Path $outputPath -PathType Leaf) {
        try {
          $len = (Get-Item $outputPath).Length
          $readState = if ($len -gt 0) { "unreadable-or-unexpected-json" } else { "empty" }
        } catch { $readState = "unreadable" }
      }
      $diag = [ordered]@{
        runType = $null
        webdriverError = $null
        webdriverError1 = $null
        webdriverError2 = $null
        hrefBeforeUiInit = $null
        windowHandlesProbeAttempted = $false
        windowHandlesSucceeded = $false
        windowHandlesCount = $null
        windowHandlesErrorClass = $null
        compareWithWindowHandlesProbe = $withWindowHandlesProbe
        runWindowHandlesProbe = $false
        windowHandlesTimingProbeControlled = $false
        compareWithWindowHandlesProbeEnv = if ($withWindowHandlesProbe) { "1" } else { $null }
        windowHandlesDelayMs = 0
        diagnosticReadState = $readState
      }
    }
    return [ordered]@{
      withWindowHandlesProbe = $withWindowHandlesProbe
      exitCode = $exitCode
      diagnostic = $diag
    }
  }

  Write-Host "[stability-test] compare-run start axis=window-handles-only with/without"
  $withWindowHandlesProbe = Invoke-CompareWindowHandlesChildRun $true
  $withoutWindowHandlesProbe = Invoke-CompareWindowHandlesChildRun $false
  $withDiag = $withWindowHandlesProbe.diagnostic
  $withoutDiag = $withoutWindowHandlesProbe.diagnostic
  $diffSummary = [ordered]@{
    runTypeChanged = ([string]$withDiag.runType -ne [string]$withoutDiag.runType)
    webdriverErrorChanged = ([string]$withDiag.webdriverError -ne [string]$withoutDiag.webdriverError)
    webdriverError1Changed = ([string]$withDiag.webdriverError1 -ne [string]$withoutDiag.webdriverError1)
    webdriverError2Changed = ([string]$withDiag.webdriverError2 -ne [string]$withoutDiag.webdriverError2)
    hrefBeforeUiInitChanged = ([string]$withDiag.hrefBeforeUiInit -ne [string]$withoutDiag.hrefBeforeUiInit)
    windowHandlesSucceededChanged = ([string]$withDiag.windowHandlesSucceeded -ne [string]$withoutDiag.windowHandlesSucceeded)
    windowHandlesCountChanged = ([string]$withDiag.windowHandlesCount -ne [string]$withoutDiag.windowHandlesCount)
    windowHandlesErrorClassChanged = ([string]$withDiag.windowHandlesErrorClass -ne [string]$withoutDiag.windowHandlesErrorClass)
    withWindowHandlesProbeAttempted = if ($null -ne $withDiag) { [bool]$withDiag.windowHandlesProbeAttempted } else { $false }
    withoutWindowHandlesProbeAttempted = if ($null -ne $withoutDiag) { [bool]$withoutDiag.windowHandlesProbeAttempted } else { $false }
  }
  $compareSummary = [ordered]@{
    comparedAt = (Get-Date).ToString("o")
    withWindowHandlesProbe = $withWindowHandlesProbe
    withoutWindowHandlesProbe = $withoutWindowHandlesProbe
    diffSummary = $diffSummary
  }
  ($compareSummary | ConvertTo-Json -Depth 10) | Set-Content -Path $script:compareSummaryPath -Encoding UTF8
  Write-Host "[stability-test] compare-run summary written path=$script:compareSummaryPath"
  Remove-Item Env:STABILITY_REPEAT_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE -ErrorAction SilentlyContinue
  return
}

if ((-not $env:STABILITY_REPEAT_CHILD) -and ($env:STABILITY_COMPARE_WINDOW_HANDLES_TIMING_MODES -eq "1")) {
  function Get-ComparePreUiSnapshotForWindowHandlesTiming() {
    if (-not (Test-Path $outputPath -PathType Leaf)) { return $null }
    try {
      $raw = Get-Content -Raw -Path $outputPath
      if ([string]::IsNullOrWhiteSpace($raw)) { return $null }
      $runType = $null
      $webdriverError = $null
      $webdriverError1 = $null
      $webdriverError2 = $null
      $hrefBeforeUiInit = $null
      $windowHandlesProbeAttempted = $false
      $windowHandlesSucceeded = $false
      $windowHandlesCount = $null
      $windowHandlesErrorClass = $null

      if ($raw -match '"runType"\s*:\s*"([^"]*)"') { $runType = [string]$Matches[1] }
      if ($raw -match '"webdriverError"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError = [string]$Matches[2] } }
      if ($raw -match '"webdriverError1"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError1 = [string]$Matches[2] } }
      if ($raw -match '"webdriverError2"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $webdriverError2 = [string]$Matches[2] } }
      if ($raw -match '"hrefBeforeUiInit"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $hrefBeforeUiInit = [string]$Matches[2] } }
      if ($raw -match '"windowHandlesProbeAttempted"\s*:\s*(true|false)') { $windowHandlesProbeAttempted = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"windowHandlesSucceeded"\s*:\s*(true|false)') { $windowHandlesSucceeded = ([string]$Matches[1] -eq "true") }
      if ($raw -match '"windowHandlesCount"\s*:\s*(null|-?\d+)') { if ($Matches[1] -ne "null") { $windowHandlesCount = [int]$Matches[1] } }
      if ($raw -match '"windowHandlesErrorClass"\s*:\s*(null|"([^"]*)")') { if ($Matches[1] -ne "null") { $windowHandlesErrorClass = [string]$Matches[2] } }

      return [ordered]@{
        runType = $runType
        webdriverError = $webdriverError
        webdriverError1 = $webdriverError1
        webdriverError2 = $webdriverError2
        hrefBeforeUiInit = $hrefBeforeUiInit
        windowHandlesProbeAttempted = $windowHandlesProbeAttempted
        windowHandlesSucceeded = $windowHandlesSucceeded
        windowHandlesCount = $windowHandlesCount
        windowHandlesErrorClass = $windowHandlesErrorClass
      }
    } catch {
      return $null
    }
  }

  function Invoke-CompareWindowHandlesTimingChildRun([int]$delayMs) {
    $env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE = "1"
    $env:STABILITY_COMPARE_WINDOW_HANDLES_DELAY_MS = [string]$delayMs
    $env:STABILITY_REPEAT_CHILD = "1"
    $env:STABILITY_COMPARE_CHILD = "1"
    try {
      & powershell -ExecutionPolicy Bypass -File $script:selfPath | Out-Null
    } catch {}
    $exitCode = $LASTEXITCODE
    $diag = $null
    for ($attempt = 1; $attempt -le 10; $attempt++) {
      $diag = Get-ComparePreUiSnapshotForWindowHandlesTiming
      if ($diag) { break }
      Start-Sleep -Milliseconds 200
    }
    return [ordered]@{
      delayMs = $delayMs
      exitCode = $exitCode
      diagnostic = $diag
    }
  }

  $fixedDelayMs = 1000
  Write-Host "[stability-test] compare-run start axis=window-handles-timing immediate/delayed"
  $immediateWindowHandles = Invoke-CompareWindowHandlesTimingChildRun 0
  $delayedWindowHandles = Invoke-CompareWindowHandlesTimingChildRun $fixedDelayMs
  $immediateDiag = $immediateWindowHandles.diagnostic
  $delayedDiag = $delayedWindowHandles.diagnostic
  $diffSummary = [ordered]@{
    runTypeChanged = ([string]$immediateDiag.runType -ne [string]$delayedDiag.runType)
    webdriverErrorChanged = ([string]$immediateDiag.webdriverError -ne [string]$delayedDiag.webdriverError)
    webdriverError1Changed = ([string]$immediateDiag.webdriverError1 -ne [string]$delayedDiag.webdriverError1)
    webdriverError2Changed = ([string]$immediateDiag.webdriverError2 -ne [string]$delayedDiag.webdriverError2)
    hrefBeforeUiInitChanged = ([string]$immediateDiag.hrefBeforeUiInit -ne [string]$delayedDiag.hrefBeforeUiInit)
    windowHandlesSucceededChanged = ([string]$immediateDiag.windowHandlesSucceeded -ne [string]$delayedDiag.windowHandlesSucceeded)
    windowHandlesCountChanged = ([string]$immediateDiag.windowHandlesCount -ne [string]$delayedDiag.windowHandlesCount)
    windowHandlesErrorClassChanged = ([string]$immediateDiag.windowHandlesErrorClass -ne [string]$delayedDiag.windowHandlesErrorClass)
    delayMsChanged = ([string]$immediateWindowHandles.delayMs -ne [string]$delayedWindowHandles.delayMs)
  }
  $compareSummary = [ordered]@{
    comparedAt = (Get-Date).ToString("o")
    immediateWindowHandles = $immediateWindowHandles
    delayedWindowHandles = $delayedWindowHandles
    diffSummary = $diffSummary
  }
  ($compareSummary | ConvertTo-Json -Depth 10) | Set-Content -Path $script:compareSummaryPath -Encoding UTF8
  Write-Host "[stability-test] compare-run summary written path=$script:compareSummaryPath"
  Remove-Item Env:STABILITY_REPEAT_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_CHILD -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE -ErrorAction SilentlyContinue
  Remove-Item Env:STABILITY_COMPARE_WINDOW_HANDLES_DELAY_MS -ErrorAction SilentlyContinue
  return
}

if (-not $env:STABILITY_REPEAT_CHILD) {
  $repeatCount = 5
  if (-not [string]::IsNullOrWhiteSpace($env:STABILITY_REPEAT_COUNT)) {
    try {
      $parsedRepeatCount = [int]$env:STABILITY_REPEAT_COUNT
      if ($parsedRepeatCount -gt 0) { $repeatCount = $parsedRepeatCount }
    } catch {}
  }
  $runs = @()
  for ($i = 1; $i -le $repeatCount; $i++) {
    Write-Host "[stability-test] repeat-run start index=$i/$repeatCount"
    $env:STABILITY_REPEAT_CHILD = "1"
    try {
      & powershell -ExecutionPolicy Bypass -File $MyInvocation.MyCommand.Path
    } catch {}
    $exitCode = $LASTEXITCODE
    $diag = $null
    if (Test-Path $outputPath -PathType Leaf) {
      try {
        $json = Get-Content -Raw -Path $outputPath | ConvertFrom-Json -Depth 20
        $diag = $json.preUiInitDiagnostic
      } catch { $diag = $null }
    }
    $we = if ($diag -and $null -ne $diag.webdriverError) { [string]$diag.webdriverError } else { $null }
    $we1 = if ($diag -and $null -ne $diag.webdriverError1) { [string]$diag.webdriverError1 } else { $null }
    $we2 = if ($diag -and $null -ne $diag.webdriverError2) { [string]$diag.webdriverError2 } else { $null }
    $runType = if ($diag -and $diag.runType) { [string]$diag.runType } else { if (([string]::IsNullOrWhiteSpace($we)) -and ([string]::IsNullOrWhiteSpace($we1)) -and ([string]::IsNullOrWhiteSpace($we2))) { "timeout_only" } else { "mixed_webdriver_error" } }
    $runs += [ordered]@{
      runIndex = $i
      exitCode = $exitCode
      runType = $runType
      webdriverError = $we
      webdriverError1 = $we1
      webdriverError2 = $we2
    }
  }
  $mixedCount = @($runs | Where-Object { $_.runType -eq "mixed_webdriver_error" }).Count
  $summary = [ordered]@{
    repeatCount = $repeatCount
    mixedWebdriverErrorDetected = ($mixedCount -gt 0)
    mixedCount = $mixedCount
    timeoutOnlyCount = @($runs | Where-Object { $_.runType -eq "timeout_only" }).Count
    allTimeoutOnly = ($mixedCount -eq 0)
    runs = $runs
    generatedAt = (Get-Date).ToString("o")
  }
  ($summary | ConvertTo-Json -Depth 8) | Set-Content -Path $script:repeatSummaryPath -Encoding UTF8
  Write-Host "[stability-test] repeat-run summary written path=$script:repeatSummaryPath mixed=$($summary.mixedWebdriverErrorDetected)"
  Remove-Item Env:STABILITY_REPEAT_CHILD -ErrorAction SilentlyContinue
  return
}

function Log-Step([string]$step, [string]$phase = "start") {
  Write-Host "[stability-test] step=$step phase=$phase"
}

function Get-SourceCommitShort() {
  try {
    $value = (& git -C $script:projectRoot rev-parse --short HEAD 2>$null | Select-Object -First 1)
    if ([string]::IsNullOrWhiteSpace($value)) { return $null }
    return [string]$value.Trim()
  } catch {
    return $null
  }
}

function Get-DateOrMin([object]$value) {
  try {
    if ($null -eq $value) { return [DateTime]::MinValue }
    return [DateTime]::Parse([string]$value, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::RoundtripKind)
  } catch {
    return [DateTime]::MinValue
  }
}

function Get-ExistingRunHistory() {
  if (-not (Test-Path $outputPath -PathType Leaf)) { return @() }
  try {
    $raw = Get-Content -Raw -Path $outputPath
    if ([string]::IsNullOrWhiteSpace($raw)) { return @() }
    $json = $raw | ConvertFrom-Json -Depth 20
    $history = @()
    if ($json.runHistory) {
      $history = @($json.runHistory)
    } elseif ($json.runFinishedAt) {
      $history = @([ordered]@{
        runStartedAt = $json.runStartedAt
        runFinishedAt = $json.runFinishedAt
        sourceCommit = $json.sourceCommit
        outputWrittenAt = (Get-Date).ToString("o")
        multiBranchEdgeCountMatch = $null
      })
    }
    return @($history)
  } catch {
    return @()
  }
}

function Get-MultiBranchEdgeCountMatch([object]$payload) {
  try {
    $cases = @($payload.downstream_contract.cases)
    if (-not $cases.Count) { return $null }
    $target = $cases | Where-Object { [string]$_.name -eq "threeway_2light_plus_outlet" } | Select-Object -First 1
    if (-not $target) { return $null }
    return [bool]$target.checks.edge_count_match
  } catch {
    return $null
  }
}

function Write-OutputJson([object]$payload, [int]$depth = 8, [bool]$markFinished = $false) {
  $finishedAt = if ($markFinished) { (Get-Date).ToString("o") } else { $null }
  $root = [ordered]@{
    runStartedAt = $script:runStartedAt
    runFinishedAt = $finishedAt
    sourceCommit = if ([string]::IsNullOrWhiteSpace($script:sourceCommit)) { $null } else { $script:sourceCommit }
  }

  if ($payload -is [System.Collections.IDictionary]) {
    foreach ($key in $payload.Keys) {
      $root[$key] = $payload[$key]
    }
  } elseif ($null -ne $payload) {
    $props = @($payload.PSObject.Properties)
    if ($props.Count -gt 0) {
      foreach ($prop in $props) {
        $root[$prop.Name] = $prop.Value
      }
    } else {
      $root["result"] = $payload
    }
  }

  if ($markFinished) {
    $history = Get-ExistingRunHistory
    $currentEntry = [ordered]@{
      runStartedAt = $script:runStartedAt
      runFinishedAt = $finishedAt
      sourceCommit = if ([string]::IsNullOrWhiteSpace($script:sourceCommit)) { $null } else { $script:sourceCommit }
      outputWrittenAt = (Get-Date).ToString("o")
      multiBranchEdgeCountMatch = Get-MultiBranchEdgeCountMatch $payload
    }
    $history = @($history + @($currentEntry))
    $history = @(
      $history |
        Sort-Object `
          @{ Expression = { Get-DateOrMin $_.runFinishedAt }; Descending = $true }, `
          @{ Expression = { Get-DateOrMin $_.outputWrittenAt }; Descending = $true }
    )
    if ($history.Count -gt 20) { $history = @($history[0..19]) }

    $selected = @($history | Select-Object -First 3)
    $selectedRuns = @(
      $selected | ForEach-Object {
        [ordered]@{
          runFinishedAt = $_.runFinishedAt
          sourceCommit = $_.sourceCommit
        }
      }
    )
    $hasCompleteWindow = ($selected.Count -eq 3)
    $edgeFailures = if ($hasCompleteWindow) {
      @($selected | Where-Object { $_.multiBranchEdgeCountMatch -eq $false }).Count
    } else {
      0
    }

    $root["runHistory"] = $history
    $root["selectedRuns"] = $selectedRuns
    $root["edgeCountFailuresInSelectedRuns"] = [int]$edgeFailures
    $root["shouldReviewVisitedJunctions"] = [bool]($hasCompleteWindow -and $edgeFailures -ge 2)
    $root["reason"] = if (-not $hasCompleteWindow) { "missing run window" } else { "$edgeFailures of 3 failed" }
  }

  [IO.File]::WriteAllText($outputPath, ($root | ConvertTo-Json -Depth $depth), [Text.UTF8Encoding]::new($false))
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

function Start-ChromeDriverVerbose() {
  if (-not $script:driverPort) {
    throw "Driver port is not initialized."
  }
  $logStamp = (Get-Date).ToString("yyyyMMdd-HHmmss-fff")
  $script:chromeDriverLogPath = Join-Path $script:projectRoot "cd.run-$logStamp.log"
  Write-Host "[stability-test] runStartedAt=$($script:runStartedAt)"
  Write-Host "[stability-test] chromedriver-log=$($script:chromeDriverLogPath)"
  $script:driverProc = Start-Process -FilePath $chromeDriverPath -ArgumentList @("--port=$($script:driverPort)", "--verbose", "--log-path=$($script:chromeDriverLogPath)") -PassThru
}

function Read-ChromeDriverVerboseHighlights([string]$logPath) {
  if (-not (Test-Path $logPath -PathType Leaf)) {
    Write-Host "[stability-test] cd-log highlights: log not found ($logPath)"
    return
  }
  $patterns = @("execute", "DevTools", "Runtime", "timeout", "pipe", "error", "warning")
  $lines = Get-Content -Path $logPath -ErrorAction SilentlyContinue
  foreach ($pattern in $patterns) {
    $hit = $lines | Select-String -Pattern $pattern -CaseSensitive:$false | Select-Object -Last 2
    if ($hit) {
      foreach ($h in $hit) {
        Write-Host "[stability-test] cd-log[$pattern] $($h.Line)"
      }
    } else {
      Write-Host "[stability-test] cd-log[$pattern] <none>"
    }
  }
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

function Build-ExecutePayloadJson([string]$scriptText) {
  @{ script = $scriptText; args = @() } | ConvertTo-Json -Compress -Depth 5
}

function Invoke-ExecuteSyncViaCurl([string]$sessionId, [string]$scriptText = "return 1;") {
  $url = "$($script:driverBaseUrl)/session/$sessionId/execute/sync"
  $payload = Build-ExecutePayloadJson $scriptText
  Write-Host "[stability-test] curl-exec target=$url"
  Write-Host "[stability-test] curl-exec payload=$payload"

  $stdoutPath = [IO.Path]::GetTempFileName()
  $stderrPath = [IO.Path]::GetTempFileName()
  try {
    $args = @(
      "--silent",
      "--show-error",
      "--max-time", "20",
      "-X", "POST",
      "-H", "Content-Type:application/json",
      "--data", $payload,
      $url
    )
    $proc = Start-Process -FilePath "curl.exe" -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    $stdout = ""
    $stderr = ""
    try { $stdout = Get-Content -Raw -Path $stdoutPath } catch {}
    try { $stderr = Get-Content -Raw -Path $stderrPath } catch {}
    $stdoutShort = if ($stdout.Length -gt 240) { $stdout.Substring(0, 240) } else { $stdout }
    $stderrShort = if ($stderr.Length -gt 240) { $stderr.Substring(0, 240) } else { $stderr }
    Write-Host "[stability-test] curl-exec exitCode=$($proc.ExitCode)"
    Write-Host "[stability-test] curl-exec stdout=$stdoutShort"
    Write-Host "[stability-test] curl-exec stderr=$stderrShort"
    if ($proc.ExitCode -eq 0 -and $stdout -match '"value"\s*:\s*1') {
      Write-Host "[stability-test] curl execute succeeded; likely PowerShell request construction issue"
      return $true
    }
    Write-Host "[stability-test] curl execute failed; likely ChromeDriver-side issue"
    return $false
  } catch {
    Write-Host "[stability-test] curl-exec failed error=$($_.Exception.Message)"
    Write-Host "[stability-test] curl execute failed; likely ChromeDriver-side issue"
    return $false
  } finally {
    try { Remove-Item $stdoutPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $stderrPath -Force -ErrorAction SilentlyContinue } catch {}
  }
}

function Invoke-ExecuteSyncViaCurlFileTrace([string]$sessionId, [string]$bodyPath) {
  $url = "$($script:driverBaseUrl)/session/$sessionId/execute/sync"
  $script:curlProbeTracePath = Join-Path $script:projectRoot "curl-trace.txt"
  try {
    $args = @(
      "--silent",
      "--show-error",
      "--max-time", "20",
      "--trace-ascii", $script:curlProbeTracePath,
      "-X", "POST",
      "-H", "Content-Type:application/json",
      "--data-binary", "@$bodyPath",
      $url
    )
    $traceOutPath = [IO.Path]::GetTempFileName()
    $traceErrPath = [IO.Path]::GetTempFileName()
    try {
      $proc = Start-Process -FilePath "curl.exe" -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput $traceOutPath -RedirectStandardError $traceErrPath
      Write-Host "[stability-test] curl-file-trace exitCode=$($proc.ExitCode) trace=$($script:curlProbeTracePath)"
      if (Test-Path $script:curlProbeTracePath -PathType Leaf) {
        $traceLines = Get-Content -Path $script:curlProbeTracePath -ErrorAction SilentlyContinue
        $sendLine = ($traceLines | Select-String "Send data").LineNumber | Select-Object -First 1
        if ($sendLine) {
          $start = [Math]::Max(1, $sendLine - 2)
          $end = [Math]::Min($traceLines.Count, $sendLine + 6)
          $snippet = ($traceLines[($start - 1)..($end - 1)] -join " | ")
          Write-Host "[stability-test] curl-file-trace snippet=$snippet"
        }
      }
    } finally {
      try { Remove-Item $traceOutPath -Force -ErrorAction SilentlyContinue } catch {}
      try { Remove-Item $traceErrPath -Force -ErrorAction SilentlyContinue } catch {}
    }
  } catch {
    Write-Host "[stability-test] curl-file-trace error=$($_.Exception.Message)"
  }
}

function Invoke-ExecuteSyncViaCurlFile([string]$sessionId, [string]$scriptText = "return 1;") {
  $url = "$($script:driverBaseUrl)/session/$sessionId/execute/sync"
  $script:curlProbeBodyPath = Join-Path $script:projectRoot "body.json"
  $payload = Build-ExecutePayloadJson $scriptText
  [IO.File]::WriteAllText($script:curlProbeBodyPath, $payload, [Text.UTF8Encoding]::new($false))
  Write-Host "[stability-test] curl-file-exec target=$url"
  Write-Host "[stability-test] curl-file-exec bodyFile=$($script:curlProbeBodyPath)"
  Write-Host "[stability-test] curl-file-exec payload=$payload"

  $stdoutPath = [IO.Path]::GetTempFileName()
  $stderrPath = [IO.Path]::GetTempFileName()
  try {
    $args = @(
      "--silent",
      "--show-error",
      "--max-time", "20",
      "-X", "POST",
      "-H", "Content-Type:application/json",
      "--data-binary", "@$($script:curlProbeBodyPath)",
      $url
    )
    $proc = Start-Process -FilePath "curl.exe" -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
    $stdout = ""
    $stderr = ""
    try { $stdout = Get-Content -Raw -Path $stdoutPath } catch {}
    try { $stderr = Get-Content -Raw -Path $stderrPath } catch {}
    $stdoutShort = if ($stdout.Length -gt 240) { $stdout.Substring(0, 240) } else { $stdout }
    $stderrShort = if ($stderr.Length -gt 240) { $stderr.Substring(0, 240) } else { $stderr }
    Write-Host "[stability-test] curl-file-exec exitCode=$($proc.ExitCode)"
    Write-Host "[stability-test] curl-file-exec stdout=$stdoutShort"
    Write-Host "[stability-test] curl-file-exec stderr=$stderrShort"
    if ($proc.ExitCode -eq 0 -and $stdout -match '"value"\s*:\s*1') {
      Write-Host "[stability-test] file-based curl execute succeeded; quoting/body construction was the likely issue"
      return $true
    }
    Write-Host "[stability-test] file-based curl execute failed; running trace for raw request inspection"
    Invoke-ExecuteSyncViaCurlFileTrace $sessionId $script:curlProbeBodyPath
    return $false
  } catch {
    Write-Host "[stability-test] curl-file-exec failed error=$($_.Exception.Message)"
    Write-Host "[stability-test] file-based curl execute failed; running trace for raw request inspection"
    Invoke-ExecuteSyncViaCurlFileTrace $sessionId $script:curlProbeBodyPath
    return $false
  } finally {
    try { Remove-Item $stdoutPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $stderrPath -Force -ErrorAction SilentlyContinue } catch {}
  }
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
  Start-ChromeDriverVerbose
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

function Get-CurrentSessionCapabilitiesObject() {
  @{
    capabilities = @{
      alwaysMatch = @{
        pageLoadStrategy = "none"
        "goog:chromeOptions" = @{
          args = @("--headless=new", "--disable-gpu", "--no-sandbox", "--window-size=1400,2200")
        }
      }
    }
  }
}

function New-Session {
  $caps = Get-CurrentSessionCapabilitiesObject | ConvertTo-Json -Depth 8
  $resp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session" -ContentType "application/json" -Body $caps -TimeoutSec 30
  $script:sessionId = if ($resp.value.sessionId) { $resp.value.sessionId } else { $resp.sessionId }
  if (-not $script:sessionId) { throw "Cannot create WebDriver session." }
  $resp
}

function New-WebDriverSessionMinimal() {
  $caps = @{
    capabilities = @{
      alwaysMatch = @{
        browserName = "chrome"
      }
    }
  } | ConvertTo-Json -Depth 8
  $resp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session" -ContentType "application/json" -Body $caps -TimeoutSec 30
  $sessionId = if ($resp.value.sessionId) { $resp.value.sessionId } else { $resp.sessionId }
  if (-not $sessionId) { throw "Cannot create minimal WebDriver session." }
  [ordered]@{
    sessionId = $sessionId
    response = $resp
  }
}

function Log-SessionCapabilitiesSummary($sessionResponse, [string]$label) {
  $caps = $null
  if ($sessionResponse -and $sessionResponse.value -and $sessionResponse.value.capabilities) {
    $caps = $sessionResponse.value.capabilities
  } elseif ($sessionResponse -and $sessionResponse.capabilities) {
    $caps = $sessionResponse.capabilities
  }
  $sessionId = if ($sessionResponse -and $sessionResponse.value -and $sessionResponse.value.sessionId) { $sessionResponse.value.sessionId } elseif ($sessionResponse) { $sessionResponse.sessionId } else { "" }
  $browserName = if ($caps -and $caps.browserName) { [string]$caps.browserName } else { "" }
  $pageLoadStrategy = if ($caps -and $caps.pageLoadStrategy) { [string]$caps.pageLoadStrategy } else { "" }
  $hasChromeOptions = [bool]($caps -and $caps.'goog:chromeOptions')
  $chromeArgsCount = 0
  if ($hasChromeOptions -and $caps.'goog:chromeOptions'.args) {
    $chromeArgsCount = @($caps.'goog:chromeOptions'.args).Count
  }
  Write-Host "[stability-test] session-caps label=$label sessionId=$sessionId browserName=$browserName pageLoadStrategy=$pageLoadStrategy hasChromeOptions=$hasChromeOptions chromeArgsCount=$chromeArgsCount"
}

function Test-MinimalSessionExecute() {
  $currentSessionId = $script:sessionId
  $minimalSessionId = $null
  $result = [ordered]@{
    sessionCreated = $false
    pageOpenOk = $false
    pageOpenError = ""
    capabilities = $null
    readyState = ""
    readyStateError = ""
    executeSyncOk = $false
    executeSyncValue = $null
    executeSyncError = ""
    executeSyncStatus = "not-run"
  }
  try {
    Log-Step "minimal session create" "start"
    $minimal = New-WebDriverSessionMinimal
    $minimalSessionId = $minimal.sessionId
    $result.sessionCreated = $true
    $result.capabilities = if ($minimal.response -and $minimal.response.value) { $minimal.response.value.capabilities } else { $null }
    Log-SessionCapabilitiesSummary $minimal.response "minimal"
    Log-Step "minimal session create" "done"

    $script:sessionId = $minimalSessionId
    Log-Step "minimal page open" "start"
    $openEndpoint = "$($script:driverBaseUrl)/session/$($script:sessionId)/url"
    $openPayload = @{ url = "$baseUrl/wiring-diagram.html" } | ConvertTo-Json -Compress
    $openOutPath = [IO.Path]::GetTempFileName()
    $openErrPath = [IO.Path]::GetTempFileName()
    try {
      $openArgs = @("--silent", "--show-error", "--max-time", "20", "-X", "POST", "-H", "Content-Type:application/json", "--data", $openPayload, $openEndpoint)
      $openProc = Start-Process -FilePath "curl.exe" -ArgumentList $openArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $openOutPath -RedirectStandardError $openErrPath
      if ($openProc.ExitCode -eq 0) {
        $result.pageOpenOk = $true
      } else {
        try { $result.pageOpenError = Get-Content -Raw -Path $openErrPath } catch { $result.pageOpenError = "curl exit $($openProc.ExitCode)" }
      }
    } catch {
      $result.pageOpenError = $_.Exception.Message
    } finally {
      try { Remove-Item $openOutPath -Force -ErrorAction SilentlyContinue } catch {}
      try { Remove-Item $openErrPath -Force -ErrorAction SilentlyContinue } catch {}
    }
    if (-not $result.pageOpenOk) {
      Write-Host "[stability-test] minimal page-open failed error=$($result.pageOpenError)"
    }
    Log-Step "minimal page open" "done"

    $readyStateResult = $null
    try {
      $readyStateBody = @{ script = "return document.readyState;"; args = @() } | ConvertTo-Json -Depth 8
      $readyStateResult = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session/$($script:sessionId)/execute/sync" -ContentType "application/json" -Body $readyStateBody -TimeoutSec 20
      $result.readyState = $readyStateResult.value
      Write-Host "ReadyState:" $readyStateResult.value
    } catch {
      $result.readyStateError = $_.Exception.Message
      Write-Host "ReadyState:" "error"
    }
    $readyStateSnapshot = [ordered]@{
      readyState = $result.readyState
      readyStateError = $result.readyStateError
    }
    Write-OutputJson $readyStateSnapshot 8

    Log-Step "minimal execute probe" "start"
    $exec = Invoke-WebDriverExecuteWithFallback "minimal-const-1" "return 1;" @() 1 0
    $result.executeSyncOk = [bool]$exec.ok
    $result.executeSyncValue = $exec.value
    $result.executeSyncError = $exec.error
    if ($result.executeSyncOk) {
      $result.executeSyncStatus = "success"
    } elseif ($result.executeSyncError -match "(?i)timeout") {
      $result.executeSyncStatus = "timeout"
    } else {
      $result.executeSyncStatus = "error"
    }
    Write-Host "[stability-test] minimal execute status=$($result.executeSyncStatus) ok=$($result.executeSyncOk) error=$($result.executeSyncError)"
    Log-Step "minimal execute probe" "done"
  } finally {
    if ($minimalSessionId) {
      try { Invoke-RestMethod -Method Delete -Uri "$($script:driverBaseUrl)/session/$minimalSessionId" -TimeoutSec 10 | Out-Null } catch {}
    }
    $script:sessionId = $currentSessionId
  }
  $result
}

function Test-CapabilityBisect() {
  $tests = @(
    [ordered]@{
      name = "pageLoadStrategy:none"
      alwaysMatch = @{
        browserName = "chrome"
        pageLoadStrategy = "none"
      }
    },
    [ordered]@{
      name = "goog:chromeOptions --headless"
      alwaysMatch = @{
        browserName = "chrome"
        "goog:chromeOptions" = @{
          args = @("--headless")
        }
      }
    },
    [ordered]@{
      name = "goog:chromeOptions --no-sandbox"
      alwaysMatch = @{
        browserName = "chrome"
        "goog:chromeOptions" = @{
          args = @("--no-sandbox")
        }
      }
    },
    [ordered]@{
      name = "goog:chromeOptions --disable-dev-shm-usage"
      alwaysMatch = @{
        browserName = "chrome"
        "goog:chromeOptions" = @{
          args = @("--disable-dev-shm-usage")
        }
      }
    },
    [ordered]@{
      name = "goog:chromeOptions --headless + --no-sandbox"
      alwaysMatch = @{
        browserName = "chrome"
        "goog:chromeOptions" = @{
          args = @("--headless", "--no-sandbox")
        }
      }
    }
  )
  $results = @()
  $firstTimeout = ""
  $firstError = ""
  foreach ($test in $tests) {
    Write-Host "[BISECT] Testing: $($test.name)"
    $sessionId = $null
    $sessionCreated = $false
    $navigationOk = $false
    $executeOk = $false
    $executeValue = $null
    $errorType = ""
    $errorMessage = ""
    try {
      $caps = @{ capabilities = @{ alwaysMatch = $test.alwaysMatch } } | ConvertTo-Json -Depth 8
      $createResp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session" -ContentType "application/json" -Body $caps -TimeoutSec 30
      $sessionId = if ($createResp.value.sessionId) { $createResp.value.sessionId } else { $createResp.sessionId }
      if (-not $sessionId) { throw "Cannot create bisect session." }
      $sessionCreated = $true

      $navBody = @{ url = "$baseUrl/wiring-diagram.html" } | ConvertTo-Json -Depth 8
      Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session/$sessionId/url" -ContentType "application/json" -Body $navBody -TimeoutSec 10 | Out-Null
      $navigationOk = $true

      $execBody = @{ script = "return 1;"; args = @() } | ConvertTo-Json -Depth 8
      $execResp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session/$sessionId/execute/sync" -ContentType "application/json" -Body $execBody -TimeoutSec 10
      $executeOk = $true
      $executeValue = $execResp.value
      Write-Host "[BISECT] result OK"
    } catch {
      $errorMessage = $_.Exception.Message
      if ($errorMessage -match "(?i)timeout") {
        $errorType = "TIMEOUT"
        Write-Host "[BISECT] TIMEOUT"
      } else {
        $errorType = "ERROR"
        Write-Host "[BISECT] result ERROR"
      }
    } finally {
      if ($sessionId) {
        try { Invoke-RestMethod -Method Delete -Uri "$($script:driverBaseUrl)/session/$sessionId" -TimeoutSec 10 | Out-Null } catch {}
      }
    }
    if (-not $firstTimeout -and $errorType -eq "TIMEOUT") {
      $firstTimeout = $test.name
    }
    if (-not $firstError -and $errorType -eq "ERROR") {
      $firstError = $test.name
    }
    $results += [ordered]@{
      label = $test.name
      sessionCreated = [bool]$sessionCreated
      navigationOk = [bool]$navigationOk
      executeOk = [bool]$executeOk
      executeValue = $executeValue
      errorType = $errorType
      errorMessage = $errorMessage
    }
    $partialBisect = [ordered]@{
      rootCauseCandidate = if ($firstTimeout) { $firstTimeout } elseif ($firstError) { $firstError } else { "NONE" }
      firstTimeout = if ($firstTimeout) { $firstTimeout } else { "NONE" }
      firstError = if ($firstError) { $firstError } else { "NONE" }
      results = $results
    }
    Write-OutputJson @{ capabilityBisect = $partialBisect } 8
  }
  $rootCauseCandidate = if ($firstTimeout) { $firstTimeout } elseif ($firstError) { $firstError } else { "NONE" }
  if ($rootCauseCandidate -ne "NONE") {
    Write-Host "[BISECT] ROOT CAUSE CANDIDATE: $rootCauseCandidate"
  } else {
    Write-Host "[BISECT] ROOT CAUSE CANDIDATE: NONE"
  }
  [ordered]@{
    rootCauseCandidate = $rootCauseCandidate
    firstTimeout = if ($firstTimeout) { $firstTimeout } else { "NONE" }
    firstError = if ($firstError) { $firstError } else { "NONE" }
    results = $results
  }
}

function Test-PageLoadStrategyCompare() {
  $labels = @("none", "eager")
  $results = @()
  foreach ($label in $labels) {
    $sessionId = $null
    $sessionCreated = $false
    $navigationOk = $false
    $executeOk = $false
    $executeValue = $null
    $errorType = ""
    $errorMessage = ""
    try {
      $capsObject = Get-CurrentSessionCapabilitiesObject
      $capsObject.capabilities.alwaysMatch.pageLoadStrategy = $label
      $caps = $capsObject | ConvertTo-Json -Depth 8
      $sessionResp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session" -ContentType "application/json" -Body $caps -TimeoutSec 30
      $sessionId = if ($sessionResp.value.sessionId) { $sessionResp.value.sessionId } else { $sessionResp.sessionId }
      if (-not $sessionId) { throw "Cannot create pageLoadStrategy compare session." }
      $sessionCreated = $true

      $navBody = @{ url = "$baseUrl/wiring-diagram.html" } | ConvertTo-Json -Depth 8
      Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session/$sessionId/url" -ContentType "application/json" -Body $navBody -TimeoutSec 10 | Out-Null
      $navigationOk = $true

      $execBody = @{ script = "return 1;"; args = @() } | ConvertTo-Json -Depth 8
      $execResp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session/$sessionId/execute/sync" -ContentType "application/json" -Body $execBody -TimeoutSec 10
      $executeOk = $true
      $executeValue = $execResp.value
    } catch {
      $errorMessage = $_.Exception.Message
      $errorType = if ($errorMessage -match "(?i)timeout") { "TIMEOUT" } else { "ERROR" }
    } finally {
      if ($sessionId) {
        try { Invoke-RestMethod -Method Delete -Uri "$($script:driverBaseUrl)/session/$sessionId" -TimeoutSec 10 | Out-Null } catch {}
      }
    }
    $results += [ordered]@{
      label = $label
      sessionCreated = [bool]$sessionCreated
      navigationOk = [bool]$navigationOk
      executeOk = [bool]$executeOk
      executeValue = $executeValue
      errorType = $errorType
      errorMessage = $errorMessage
    }
    Write-OutputJson @{ pageLoadStrategyCompare = @{ results = $results } } 8
  }
  $noneCase = $results | Where-Object { $_.label -eq "none" } | Select-Object -First 1
  $eagerCase = $results | Where-Object { $_.label -eq "eager" } | Select-Object -First 1
  $noneNg = (-not $noneCase.executeOk)
  $eagerOk = [bool]$eagerCase.executeOk
  $eagerNg = (-not $eagerCase.executeOk)
  $conclusion = @'
pageLoadStrategy:none 単独再現せず。他条件組み合わせ要因の可能性があります
'@
  if ($noneNg -and $eagerOk) {
    $conclusion = @'
pageLoadStrategy:none が execute failure の有力原因です
'@
  } elseif ($noneNg -and $eagerNg) {
    $conclusion = @'
pageLoadStrategy 単独では断定不可。current session の他条件影響が残ります
'@
  }
  $summary = [ordered]@{
    noneResult = if ($noneCase.executeOk) { "OK" } else { "NG" }
    eagerResult = if ($eagerCase.executeOk) { "OK" } else { "NG" }
    normalResult = "SKIP"
    conclusion = $conclusion
  }
  Write-Host "----- pageLoadStrategy 比較結果 -----"
  Write-Host "none: $($summary.noneResult)"
  Write-Host "eager: $($summary.eagerResult)"
  Write-Host "normal: $($summary.normalResult)"
  Write-Host "結論: $($summary.conclusion)"
  Write-Host "------------------------------------"
  [ordered]@{
    results = $results
    summary = $summary
  }
}

function Test-ChromeArgsSubtractCompare() {
  $baseCaps = Get-CurrentSessionCapabilitiesObject
  $baseArgs = @()
  if ($baseCaps.capabilities.alwaysMatch.'goog:chromeOptions' -and $baseCaps.capabilities.alwaysMatch.'goog:chromeOptions'.args) {
    $baseArgs = @($baseCaps.capabilities.alwaysMatch.'goog:chromeOptions'.args)
  }
  $cases = @(
    [ordered]@{ label = "base"; removedArgs = @(); skip = $false },
    [ordered]@{ label = "without --headless"; removedArgs = @("--headless"); skip = (-not ($baseArgs -contains "--headless")) },
    [ordered]@{ label = "without --no-sandbox"; removedArgs = @("--no-sandbox"); skip = (-not ($baseArgs -contains "--no-sandbox")) },
    [ordered]@{ label = "without --disable-dev-shm-usage"; removedArgs = @("--disable-dev-shm-usage"); skip = (-not ($baseArgs -contains "--disable-dev-shm-usage")) }
  )
  $results = @()
  foreach ($case in $cases) {
    $sessionId = $null
    $sessionCreated = $false
    $navigationOk = $false
    $executeOk = $false
    $executeValue = $null
    $errorType = ""
    $errorMessage = ""
    if ($case.skip) {
      $errorType = "SKIP"
      $errorMessage = "target arg is not present in current session args"
    } else {
      try {
        $capsObject = Get-CurrentSessionCapabilitiesObject
        $caseArgs = @($baseArgs)
        foreach ($arg in $case.removedArgs) {
          $caseArgs = @($caseArgs | Where-Object { $_ -ne $arg })
        }
        $capsObject.capabilities.alwaysMatch.'goog:chromeOptions'.args = $caseArgs
        $caps = $capsObject | ConvertTo-Json -Depth 8
        $sessionResp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session" -ContentType "application/json" -Body $caps -TimeoutSec 30
        $sessionId = if ($sessionResp.value.sessionId) { $sessionResp.value.sessionId } else { $sessionResp.sessionId }
        if (-not $sessionId) { throw "Cannot create chrome args subtraction compare session." }
        $sessionCreated = $true

        $navBody = @{ url = "$baseUrl/wiring-diagram.html" } | ConvertTo-Json -Depth 8
        Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session/$sessionId/url" -ContentType "application/json" -Body $navBody -TimeoutSec 10 | Out-Null
        $navigationOk = $true

        $execBody = @{ script = "return 1;"; args = @() } | ConvertTo-Json -Depth 8
        $execResp = Invoke-RestMethod -Method Post -Uri "$($script:driverBaseUrl)/session/$sessionId/execute/sync" -ContentType "application/json" -Body $execBody -TimeoutSec 10
        $executeOk = $true
        $executeValue = $execResp.value
      } catch {
        $errorMessage = $_.Exception.Message
        $errorType = if ($errorMessage -match "(?i)timeout") { "TIMEOUT" } else { "ERROR" }
      } finally {
        if ($sessionId) {
          try { Invoke-RestMethod -Method Delete -Uri "$($script:driverBaseUrl)/session/$sessionId" -TimeoutSec 10 | Out-Null } catch {}
        }
      }
    }
    $results += [ordered]@{
      label = $case.label
      removedArgs = $case.removedArgs
      sessionCreated = [bool]$sessionCreated
      navigationOk = [bool]$navigationOk
      executeOk = [bool]$executeOk
      executeValue = $executeValue
      errorType = $errorType
      errorMessage = $errorMessage
    }
    Write-OutputJson @{ chromeArgsSubtractCompare = @{ results = $results } } 8
  }
  $baseCase = $results | Where-Object { $_.label -eq "base" } | Select-Object -First 1
  $baseResult = if ($baseCase.executeOk) { "OK" } else { "NG" }
  $firstImprovedCase = "NONE"
  $conclusion = "No single-cause identified in args subtraction comparison."
  foreach ($r in $results) {
    if ($r.label -eq "base" -or $r.errorType -eq "SKIP") { continue }
    if ((-not $baseCase.executeOk) -and $r.executeOk) {
      $firstImprovedCase = $r.label
      $removed = if (@($r.removedArgs).Count -gt 0) { ($r.removedArgs -join " ") } else { $r.label }
      $conclusion = "Likely execute failure cause: $removed"
      break
    }
  }
  if ($firstImprovedCase -eq "NONE") {
    foreach ($r in $results) {
      if ($r.label -eq "base" -or $r.errorType -eq "SKIP") { continue }
      if ((-not $baseCase.navigationOk) -and $r.navigationOk) {
        $firstImprovedCase = $r.label
        $removed = if (@($r.removedArgs).Count -gt 0) { ($r.removedArgs -join " ") } else { $r.label }
        $conclusion = "Likely navigation failure contributor: $removed"
        break
      }
    }
  }
  $byLabel = @{}
  foreach ($r in $results) { $byLabel[$r.label] = $r }
  $withoutHeadless = if ($byLabel["without --headless"]) { if ($byLabel["without --headless"].errorType -eq "SKIP") { "SKIP" } elseif ($byLabel["without --headless"].executeOk) { "OK" } else { "NG" } } else { "SKIP" }
  $withoutNoSandbox = if ($byLabel["without --no-sandbox"]) { if ($byLabel["without --no-sandbox"].errorType -eq "SKIP") { "SKIP" } elseif ($byLabel["without --no-sandbox"].executeOk) { "OK" } else { "NG" } } else { "SKIP" }
  $withoutDevShm = if ($byLabel["without --disable-dev-shm-usage"]) { if ($byLabel["without --disable-dev-shm-usage"].errorType -eq "SKIP") { "SKIP" } elseif ($byLabel["without --disable-dev-shm-usage"].executeOk) { "OK" } else { "NG" } } else { "SKIP" }
  $summary = [ordered]@{
    baseResult = $baseResult
    firstImprovedCase = $firstImprovedCase
    conclusion = $conclusion
  }
  Write-Host "----- Chrome args 減算比較結果 -----"
  Write-Host "base: $baseResult"
  Write-Host "without --headless: $withoutHeadless"
  Write-Host "without --no-sandbox: $withoutNoSandbox"
  Write-Host "without --disable-dev-shm-usage: $withoutDevShm"
  Write-Host "firstImprovedCase: $firstImprovedCase"
  Write-Host "結論: $conclusion"
  Write-Host "-----------------------------------------"
  [ordered]@{
    results = $results
    summary = $summary
  }
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
  $navigateResult = Invoke-SessionNavigateViaCurl $script:sessionId "$($script:baseUrl)/wiring-diagram.html" 20
  $script:lastNavigateAttempt = $navigateResult
  if (-not $navigateResult.ok) {
    $statusText = if ($null -ne $navigateResult.httpStatus) { [string]$navigateResult.httpStatus } else { "null" }
    throw "Open-Page navigate failed: class=$([string]$navigateResult.errorClass) status=$statusText stderr=$([string]$navigateResult.stderrSummary)"
  }
}

function Open-PageViaCurl([string]$sessionId, [int]$maxTimeSec = 20) {
  $openEndpoint = "$($script:driverBaseUrl)/session/$sessionId/url"
  $openPayload = @{ url = "$($script:baseUrl)/wiring-diagram.html" } | ConvertTo-Json -Compress
  $openOutPath = [IO.Path]::GetTempFileName()
  $openErrPath = [IO.Path]::GetTempFileName()
  try {
    $openArgs = @("--silent", "--show-error", "--max-time", "$maxTimeSec", "-X", "POST", "-H", "Content-Type:application/json", "--data", $openPayload, $openEndpoint)
    $openProc = Start-Process -FilePath "curl.exe" -ArgumentList $openArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $openOutPath -RedirectStandardError $openErrPath
    if ($openProc.ExitCode -eq 0) { return $true }
    $openErr = ""
    try { $openErr = Get-Content -Raw -Path $openErrPath } catch {}
    Write-Host "[stability-test] curl page-open failed exitCode=$($openProc.ExitCode) error=$openErr"
    $false
  } finally {
    try { Remove-Item $openOutPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $openErrPath -Force -ErrorAction SilentlyContinue } catch {}
  }
}

function Get-CdLogTailCompact([string]$logPath, [int]$maxLines = 10, [int]$maxChars = 420) {
  if ([string]::IsNullOrWhiteSpace($logPath) -or -not (Test-Path $logPath -PathType Leaf)) {
    return "n/a"
  }
  try {
    $lines = Get-Content -Path $logPath -Tail $maxLines -ErrorAction SilentlyContinue
    if (-not $lines) { return "(empty)" }
    $s = [string]::Join(" ", @($lines))
    $s = ($s -replace "`r`n|`n|`r", " ") -replace '\s+', ' '
    $s = $s -replace '\|', '/'
    if ($s.Length -gt $maxChars) {
      $s = $s.Substring($s.Length - $maxChars)
    }
    return $s
  } catch {
    return "err"
  }
}

function Get-CdLogPostKeywordFlags([string]$tail) {
  if ([string]::IsNullOrWhiteSpace($tail) -or $tail -eq "n/a" -or $tail -eq "(empty)") {
    return " postCdHasSessionsKeyword=0 postCdHasCommandKeyword=0 postCdHasDevToolsKeyword=0"
  }
  $t = $tail.ToLowerInvariant()
  $s = 0
  if (($t.IndexOf("/sessions") -ge 0) -or ($t.IndexOf("session list") -ge 0) -or ($t.IndexOf("/session/") -ge 0) -or ($t.IndexOf("sessions") -ge 0)) { $s = 1 }
  $c = if ($t.IndexOf("command") -ge 0) { 1 } else { 0 }
  $d = 0
  if (($t.IndexOf("devtools") -ge 0) -or ($t.IndexOf("websocket") -ge 0) -or ($t.IndexOf("page") -ge 0) -or ($t.IndexOf("frame") -ge 0)) { $d = 1 }
  return " postCdHasSessionsKeyword=$s postCdHasCommandKeyword=$c postCdHasDevToolsKeyword=$d"
}

function Get-CdLogWideKeywordFlags([string]$logPath, [int]$maxLines = 80) {
  if ([string]::IsNullOrWhiteSpace($logPath) -or -not (Test-Path $logPath -PathType Leaf)) {
    return " postCdWideHasSessionsKeyword=0 postCdWideHasCommandKeyword=0"
  }
  try {
    $lines = Get-Content -Path $logPath -Tail $maxLines -ErrorAction SilentlyContinue
    if (-not $lines) {
      return " postCdWideHasSessionsKeyword=0 postCdWideHasCommandKeyword=0"
    }
    $blob = ([string]::Join(" ", @($lines))).ToLowerInvariant()
    $s = 0
    if (($blob.IndexOf("/sessions") -ge 0) -or ($blob.IndexOf("session list") -ge 0) -or ($blob.IndexOf("/session/") -ge 0) -or ($blob.IndexOf("sessions") -ge 0)) { $s = 1 }
    $c = if ($blob.IndexOf("command") -ge 0) { 1 } else { 0 }
    return " postCdWideHasSessionsKeyword=$s postCdWideHasCommandKeyword=$c"
  } catch {
    return " postCdWideHasSessionsKeyword=0 postCdWideHasCommandKeyword=0"
  }
}

function Get-CdLogSessionCommandExcerpt([string]$logPath, [int]$tailLines = 80, [int]$maxKeptLines = 3, [int]$maxChars = 480) {
  if ([string]::IsNullOrWhiteSpace($logPath) -or -not (Test-Path $logPath -PathType Leaf)) {
    return " postCdSessionCommandExcerpt=n/a"
  }
  try {
    $all = Get-Content -Path $logPath -Tail $tailLines -ErrorAction SilentlyContinue
    if (-not $all) { return " postCdSessionCommandExcerpt=(empty)" }
    $hits = @()
    foreach ($line in @($all)) {
      $lc = $line.ToLowerInvariant()
      if (($lc.IndexOf("sessions") -ge 0) -or ($lc.IndexOf("/session/") -ge 0) -or ($lc.IndexOf("command") -ge 0)) {
        $one = ($line -replace "`r`n|`n|`r", " ") -replace '\s+', ' '
        $one = ($one.Trim()) -replace '\|', '/'
        $hits += ,$one
      }
    }
    if ($hits.Count -eq 0) { return " postCdSessionCommandExcerpt=(none)" }
    if ($hits.Count -gt $maxKeptLines) {
      $hits = $hits[-$maxKeptLines..-1]
    }
    $s = [string]::Join(" // ", $hits)
    if ($s.Length -gt $maxChars) { $s = $s.Substring($s.Length - $maxChars) }
    return " postCdSessionCommandExcerpt=" + $s
  } catch {
    return " postCdSessionCommandExcerpt=err"
  }
}

function Get-NavigateSessionSyncDiagnosticsSegment([string]$label, [string]$sessionId) {
  $base = [string]$script:driverBaseUrl
  $sessionsProbeMaxSec = if ($label -eq 'post-navigate-timeout') { "10" } else { "3" }
  $portOut = "n/a"
  try {
    $u = [System.Uri]$base
    $portOut = [string]$u.Port
  } catch { $portOut = "n/a" }
  $statusExit = "n/a"
  $statusHttp = "n/a"
  $statusOk = 0
  $statusElapsedMs = "n/a"
  $sessionsElapsedMs = "n/a"
  $swStatus = $null
  $swSessions = $null
  if ($label -eq 'post-navigate-timeout') {
    $swStatus = [System.Diagnostics.Stopwatch]::StartNew()
  }
  $stBody = [IO.Path]::GetTempFileName()
  $stErr = [IO.Path]::GetTempFileName()
  $stCode = [IO.Path]::GetTempFileName()
  try {
    $stArgs = @("--silent", "--show-error", "--max-time", "3", "-o", $stBody, "-w", "%{http_code}", "$base/status")
    $stProc = Start-Process -FilePath "curl.exe" -ArgumentList $stArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $stCode -RedirectStandardError $stErr
    if ($null -ne $swStatus) {
      $swStatus.Stop()
      $statusElapsedMs = [string]$swStatus.ElapsedMilliseconds
    }
    $statusExit = [string]$stProc.ExitCode
    $stCodeRaw = ""
    try { $stCodeRaw = ([string](Get-Content -Raw -Path $stCode)).Trim() } catch { $stCodeRaw = "" }
    if ($stCodeRaw -match '^\d+$') {
      $statusHttp = $stCodeRaw
      if ($stProc.ExitCode -eq 0 -and [int]$stCodeRaw -eq 200) { $statusOk = 1 }
    }
  } catch {
    $statusExit = "err"
    if ($null -ne $swStatus -and $swStatus.IsRunning) {
      $swStatus.Stop()
      $statusElapsedMs = [string]$swStatus.ElapsedMilliseconds
    }
  } finally {
    if ($null -ne $swStatus -and $swStatus.IsRunning) {
      $swStatus.Stop()
      $statusElapsedMs = [string]$swStatus.ElapsedMilliseconds
    }
    try { Remove-Item $stBody, $stErr, $stCode -Force -ErrorAction SilentlyContinue } catch {}
  }
  $outPath = [IO.Path]::GetTempFileName()
  $errPath = [IO.Path]::GetTempFileName()
  $sessCodePath = [IO.Path]::GetTempFileName()
  $sessionsExit = "n/a"
  $sessionsHttp = "n/a"
  $sessionsOk = 0
  $sessionsCount = $null
  $sampleStr = ""
  $contains = $false
  if ($label -eq 'post-navigate-timeout') {
    $swSessions = [System.Diagnostics.Stopwatch]::StartNew()
  }
  try {
    $sessArgs = @("--silent", "--show-error", "--max-time", $sessionsProbeMaxSec, "-o", $outPath, "-w", "%{http_code}", "$base/sessions")
    $sessProc = Start-Process -FilePath "curl.exe" -ArgumentList $sessArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $sessCodePath -RedirectStandardError $errPath
    if ($null -ne $swSessions) {
      $swSessions.Stop()
      $sessionsElapsedMs = [string]$swSessions.ElapsedMilliseconds
    }
    $sessionsExit = [string]$sessProc.ExitCode
    $sessCodeRaw = ""
    try { $sessCodeRaw = ([string](Get-Content -Raw -Path $sessCodePath)).Trim() } catch { $sessCodeRaw = "" }
    if ($sessCodeRaw -match '^\d+$') {
      $sessionsHttp = $sessCodeRaw
      if ($sessProc.ExitCode -eq 0 -and [int]$sessCodeRaw -eq 200) { $sessionsOk = 1 }
    }
    $raw = ""
    try { $raw = [string](Get-Content -Raw -Path $outPath) } catch { $raw = "" }
    if (-not [string]::IsNullOrWhiteSpace($raw)) {
      $sessionsJson = $raw | ConvertFrom-Json -ErrorAction SilentlyContinue
      if ($sessionsJson -and $sessionsJson.value) {
        $valueList = @($sessionsJson.value)
        $sessionsCount = $valueList.Count
        $idBag = New-Object System.Collections.Generic.List[string]
        foreach ($entry in $valueList) {
          if ($entry -and $entry.id) { $idBag.Add([string]$entry.id) }
          if ($entry -and $entry.sessionId) { $idBag.Add([string]$entry.sessionId) }
        }
        $ids = @($idBag | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
        $contains = (-not [string]::IsNullOrWhiteSpace($sessionId)) -and ($ids -contains $sessionId)
        $take = [Math]::Min(5, $ids.Count)
        if ($take -gt 0) { $idsSample = $ids[0..($take-1)] } else { $idsSample = @() }
        $sampleStr = [string]::Join(',', $idsSample)
      }
    }
  } catch {
    $sessionsExit = "err"
    if ($null -ne $swSessions -and $swSessions.IsRunning) {
      $swSessions.Stop()
      $sessionsElapsedMs = [string]$swSessions.ElapsedMilliseconds
    }
  } finally {
    if ($null -ne $swSessions -and $swSessions.IsRunning) {
      $swSessions.Stop()
      $sessionsElapsedMs = [string]$swSessions.ElapsedMilliseconds
    }
    try { Remove-Item $outPath, $errPath, $sessCodePath -Force -ErrorAction SilentlyContinue } catch {}
  }
  $sessions2Exit = "n/a"
  $sessions2Http = "n/a"
  $sessions2Ok = 0
  $sessions2ElapsedMs = "n/a"
  if ($label -eq 'post-navigate-timeout') {
    $outPath2 = [IO.Path]::GetTempFileName()
    $errPath2 = [IO.Path]::GetTempFileName()
    $sessCodePath2 = [IO.Path]::GetTempFileName()
    $swSessions2 = [System.Diagnostics.Stopwatch]::StartNew()
    try {
      $sessArgs2 = @("--silent", "--show-error", "--max-time", $sessionsProbeMaxSec, "-o", $outPath2, "-w", "%{http_code}", "$base/sessions")
      $sessProc2 = Start-Process -FilePath "curl.exe" -ArgumentList $sessArgs2 -NoNewWindow -Wait -PassThru -RedirectStandardOutput $sessCodePath2 -RedirectStandardError $errPath2
      if ($null -ne $swSessions2) {
        $swSessions2.Stop()
        $sessions2ElapsedMs = [string]$swSessions2.ElapsedMilliseconds
      }
      $sessions2Exit = [string]$sessProc2.ExitCode
      $sessCodeRaw2 = ""
      try { $sessCodeRaw2 = ([string](Get-Content -Raw -Path $sessCodePath2)).Trim() } catch { $sessCodeRaw2 = "" }
      if ($sessCodeRaw2 -match '^\d+$') {
        $sessions2Http = $sessCodeRaw2
        if ($sessProc2.ExitCode -eq 0 -and [int]$sessCodeRaw2 -eq 200) { $sessions2Ok = 1 }
      }
    } catch {
      $sessions2Exit = "err"
      if ($null -ne $swSessions2 -and $swSessions2.IsRunning) {
        $swSessions2.Stop()
        $sessions2ElapsedMs = [string]$swSessions2.ElapsedMilliseconds
      }
    } finally {
      if ($null -ne $swSessions2 -and $swSessions2.IsRunning) {
        $swSessions2.Stop()
        $sessions2ElapsedMs = [string]$swSessions2.ElapsedMilliseconds
      }
      try { Remove-Item $outPath2, $errPath2, $sessCodePath2 -Force -ErrorAction SilentlyContinue } catch {}
    }
  }
  $scOut = if ($null -ne $sessionsCount) { [string]$sessionsCount } else { "n/a" }
  $containsOut = if ($contains) { 1 } else { 0 }
  $driverPid = "n/a"
  $driverProcessFound = 0
  $driverAlive = "n/a"
  $driverName = "n/a"
  if ($label -eq 'post-navigate-timeout') {
    try {
      if ($null -ne $script:driverProc -and $script:driverProc.Id) {
        $driverPid = [string]$script:driverProc.Id
        $driverProcessFound = 1
        $gp = Get-Process -Id $script:driverProc.Id -ErrorAction SilentlyContinue
        if ($null -ne $gp) {
          try { $gp.Refresh() } catch {}
          $driverAlive = if ($gp.HasExited) { 0 } else { 1 }
          $driverName = [string]$gp.ProcessName
        } else {
          $driverAlive = 0
          $driverName = "gone"
        }
      }
    } catch {
      $driverProcessFound = 0
      $driverAlive = "err"
      $driverName = "err"
    }
  }
  $core = 'navigate session-sync label={0} driverBaseUrl={1} port={2} sessionId={3} statusExit={4} statusHttp={5} statusOk={6} sessionsExit={7} sessionsHttp={8} sessionsOk={9} sessionsCount={10} sessionIdsSample={11} containsTarget={12} sessionsMaxTimeSec={13}' -f $label, $base, $portOut, $sessionId, $statusExit, $statusHttp, $statusOk, $sessionsExit, $sessionsHttp, $sessionsOk, $scOut, $sampleStr, $containsOut, $sessionsProbeMaxSec
  if ($label -eq 'post-navigate-timeout') {
    $core = $core + ' statusElapsedMs=' + $statusElapsedMs + ' sessionsElapsedMs=' + $sessionsElapsedMs + ' sessions2Exit=' + $sessions2Exit + ' sessions2Http=' + $sessions2Http + ' sessions2Ok=' + $sessions2Ok + ' sessions2ElapsedMs=' + $sessions2ElapsedMs
    $core = $core + ' | driverProbe driverPid=' + $driverPid + ' driverProcessFound=' + $driverProcessFound + ' driverAlive=' + $driverAlive + ' driverName=' + $driverName
  }
  $core
}

function Write-NavigateSessionSyncDiagnostics([string]$label, [string]$sessionId) {
  Write-Host ('[stability-test] ' + (Get-NavigateSessionSyncDiagnosticsSegment $label $sessionId))
}

function Invoke-SessionNavigateViaCurl([string]$sessionId, [string]$targetUrl, [int]$maxTimeSec = 20) {
  $result = [ordered]@{
    ok = $false
    transportUsed = "curl"
    httpStatus = $null
    responseBody = ""
    stderrSummary = ""
    webdriverError = $null
    errorClass = "unknown"
    errorMessage = ""
    exitCode = $null
    maxTimeSecApplied = $maxTimeSec
  }
  $endpoint = "$($script:driverBaseUrl)/session/$sessionId/url"
  Write-Host ('[stability-test] direct webdriver navigate phase=start target={0} maxTimeSec={1} endpoint={2}' -f $targetUrl, $maxTimeSec, $endpoint)
  Write-NavigateSessionSyncDiagnostics 'pre-navigate' $sessionId
  $preCdTail = Get-CdLogTailCompact $script:chromeDriverLogPath 10 420
  Write-Host ('[stability-test] cd-log-tail label=pre-direct-url preNavigateCdLogTail=' + $preCdTail)
  $emitNavPhase = {
    param([string]$phaseLabel, [string]$sessionSyncSegment = "")
    $bl = 0
    if ($result.responseBody) { $bl = $result.responseBody.Length }
    $bp = ""
    if ($bl -gt 0) {
      $take = [Math]::Min(200, $bl)
      $bp = (($result.responseBody.Substring(0, $take)) -replace "[\r\n]+", " ")
    }
    $cls = if ($null -ne $result.errorClass) { [string]$result.errorClass } else { "" }
    $line = '[stability-test] direct webdriver navigate phase=' + $phaseLabel + ' exitCode=' + $result.exitCode + ' httpStatus=' + $result.httpStatus + ' maxTimeSec=' + $maxTimeSec + ' class=' + $cls + ' bodyLen=' + $bl + ' bodyPreview=' + $bp + ' stderrSummary=' + $result.stderrSummary
    if ($sessionSyncSegment) { $line = $line + ' | [stability-test] ' + $sessionSyncSegment }
    if ($sessionSyncSegment -and ($sessionSyncSegment -match 'label=post-navigate-timeout')) {
      try {
        $timeoutDiagPath = Join-Path $script:projectRoot ".tmp_navigate_last_direct_timeout.txt"
        [IO.File]::WriteAllText($timeoutDiagPath, $line + "`r`n", [Text.UTF8Encoding]::new($false))
      } catch {}
    }
    Write-Host $line
  }
  $payload = @{ url = $targetUrl } | ConvertTo-Json -Compress
  $bodyPath = [IO.Path]::GetTempFileName()
  $errPath = [IO.Path]::GetTempFileName()
  $statusPath = [IO.Path]::GetTempFileName()
  $payloadPath = [IO.Path]::GetTempFileName()
  try {
    [IO.File]::WriteAllText($payloadPath, $payload, [Text.UTF8Encoding]::new($false))
    $args = @("--silent", "--show-error", "--max-time", "$maxTimeSec", "-o", $bodyPath, "-w", "%{http_code}", "-X", "POST", "-H", "Content-Type:application/json", "--data-binary", "@$payloadPath", $endpoint)
    $proc = Start-Process -FilePath "curl.exe" -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput $statusPath -RedirectStandardError $errPath
    $result.exitCode = $proc.ExitCode
    $statusRaw = ""
    try { $statusRaw = [string](Get-Content -Raw -Path $statusPath) } catch { $statusRaw = "" }
    $statusRaw = $statusRaw.Trim()
    if ($statusRaw -match '^\d+$') {
      try { $result.httpStatus = [int]$statusRaw } catch { $result.httpStatus = $null }
    }
    try { $result.responseBody = [string](Get-Content -Raw -Path $bodyPath) } catch { $result.responseBody = "" }
    try { $result.stderrSummary = [string](Get-Content -Raw -Path $errPath) } catch { $result.stderrSummary = "" }
  } finally {
    try { Remove-Item $payloadPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $bodyPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $errPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $statusPath -Force -ErrorAction SilentlyContinue } catch {}
  }
  if ($result.responseBody.Length -gt 800) { $result.responseBody = $result.responseBody.Substring(0, 800) }
  if ($result.stderrSummary.Length -gt 500) { $result.stderrSummary = $result.stderrSummary.Substring(0, 500) }
  $stderrLower = ""
  try { $stderrLower = $result.stderrSummary.ToLowerInvariant() } catch { $stderrLower = "" }
  if (($result.exitCode -eq 28) -or ($stderrLower -match "timeout")) {
    $result.errorClass = "timeout"
    $result.errorMessage = if ($result.stderrSummary) { $result.stderrSummary } else { "curl timeout" }
    $postSyncSeg = Get-NavigateSessionSyncDiagnosticsSegment 'post-navigate-timeout' $sessionId
    $postCdTail = Get-CdLogTailCompact $script:chromeDriverLogPath 10 420
    $postSyncSeg = $postSyncSeg + ' postNavigateCdLogTail=' + $postCdTail + (Get-CdLogPostKeywordFlags $postCdTail) + (Get-CdLogWideKeywordFlags $script:chromeDriverLogPath 80) + (Get-CdLogSessionCommandExcerpt $script:chromeDriverLogPath)
    & $emitNavPhase 'error' $postSyncSeg
    return $result
  }
  if ($result.exitCode -ne 0) {
    $result.errorClass = "curl-error"
    $result.errorMessage = if ($result.stderrSummary) { $result.stderrSummary } else { "curl exitCode=$($result.exitCode)" }
    & $emitNavPhase 'error'
    return $result
  }
  $wdError = $null
  $wdMessage = ""
  try {
    if (-not [string]::IsNullOrWhiteSpace($result.responseBody)) {
      $json = $result.responseBody | ConvertFrom-Json -ErrorAction Stop
      if ($json -and $json.value -and $json.value.error) {
        $wdError = [string]$json.value.error
        if ($json.value.message) { $wdMessage = [string]$json.value.message }
      } elseif ($json -and $json.error) {
        # Fallback for non-W3C style error payloads.
        $wdError = [string]$json.error
        if ($json.message) { $wdMessage = [string]$json.message }
      }
    }
  } catch {}
  if ([string]::IsNullOrWhiteSpace($wdError) -and (-not [string]::IsNullOrWhiteSpace($result.responseBody))) {
    if ($result.responseBody -match '"error"\s*:\s*"([^"]+)"') {
      $wdError = [string]$Matches[1]
    }
  }
  $result.webdriverError = $wdError
  if ($wdError) {
    $wdErrorLower = $wdError.ToLowerInvariant()
    $wdMessageLower = $wdMessage.ToLowerInvariant()
    if (($wdErrorLower -match "timeout") -or ($wdMessageLower -match "timeout")) {
      $result.errorClass = "timeout"
    } elseif (($wdErrorLower -match "no such window") -or ($wdMessageLower -match "no such window")) {
      $result.errorClass = "no-such-window"
    } elseif (($wdErrorLower -match "invalid session id") -or ($wdMessageLower -match "invalid session id")) {
      $result.errorClass = "invalid-session-id"
    } elseif (($wdErrorLower -match "unknown command") -or ($wdMessageLower -match "unknown command")) {
      $result.errorClass = "unknown-command"
    } else {
      $result.errorClass = "webdriver-error"
    }
    $result.errorMessage = if ($wdMessage) { $wdMessage } else { $wdError }
    & $emitNavPhase 'error'
    return $result
  }
  if (($null -ne $result.httpStatus) -and (($result.httpStatus -lt 200) -or ($result.httpStatus -ge 300))) {
    if ($result.httpStatus -eq 404) {
      $result.errorClass = "http-404"
    } else {
      $result.errorClass = "http-error"
    }
    $result.errorMessage = "http status=$($result.httpStatus)"
    & $emitNavPhase 'error'
    return $result
  }
  $result.ok = $true
  $result.errorClass = $null
  $result.errorMessage = ""
  & $emitNavPhase 'done'
  $result
}

function Invoke-WindowHandleCheck([string]$sessionId) {
  $result = [ordered]@{
    windowCheckAttempted = $false
    windowCheckStdout = ""
    windowCheckStderr = ""
    windowCheckExitCode = $null
    windowHandleFound = $false
    windowHandleValue = $null
    windowHandleErrorClass = $null
    windowHandleErrorMessage = $null
  }
  $windowStdoutRaw = ""
  $windowOutPath = [IO.Path]::GetTempFileName()
  $windowErrPath = [IO.Path]::GetTempFileName()
  try {
    $result.windowCheckAttempted = $true
    $windowArgs = @("--silent", "--show-error", "--max-time", "5", "$($script:driverBaseUrl)/session/$sessionId/window")
    $windowProc = Start-Process -FilePath "curl.exe" -ArgumentList $windowArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $windowOutPath -RedirectStandardError $windowErrPath
    $result.windowCheckExitCode = $windowProc.ExitCode
    try { $result.windowCheckStdout = [string](Get-Content -Raw -Path $windowOutPath) } catch { $result.windowCheckStdout = "" }
    $windowStdoutRaw = $result.windowCheckStdout
    try { $result.windowCheckStderr = [string](Get-Content -Raw -Path $windowErrPath) } catch { $result.windowCheckStderr = "" }
  } finally {
    try { Remove-Item $windowOutPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $windowErrPath -Force -ErrorAction SilentlyContinue } catch {}
  }
  if ($result.windowCheckStdout.Length -gt 500) { $result.windowCheckStdout = $result.windowCheckStdout.Substring(0, 500) }
  if ($result.windowCheckStderr.Length -gt 500) { $result.windowCheckStderr = $result.windowCheckStderr.Substring(0, 500) }
  if ($result.windowCheckExitCode -ne 0) {
    $errLower = ""
    try { $errLower = ([string]$result.windowCheckStderr).ToLowerInvariant() } catch { $errLower = "" }
    if (($result.windowCheckExitCode -eq 28) -or ($errLower -match "timeout")) {
      $result.windowHandleErrorClass = "timeout"
    } else {
      $result.windowHandleErrorClass = "curl-error"
    }
    $result.windowHandleErrorMessage = [string]$result.windowCheckStderr
  }
  try {
    if (-not [string]::IsNullOrWhiteSpace($windowStdoutRaw)) {
      $windowJson = $windowStdoutRaw | ConvertFrom-Json -ErrorAction Stop
      if ($windowJson -and $windowJson.PSObject.Properties.Name -contains "value" -and $windowJson.value -is [string]) {
        $result.windowHandleValue = [string]$windowJson.value
        $result.windowHandleFound = -not [string]::IsNullOrWhiteSpace($result.windowHandleValue)
        if ($result.windowHandleFound) {
          $result.windowHandleErrorClass = $null
          $result.windowHandleErrorMessage = $null
        }
      } elseif ($windowJson -and $windowJson.value -and $windowJson.value.error) {
        $rawError = [string]$windowJson.value.error
        $rawMessage = if ($windowJson.value.message) { [string]$windowJson.value.message } else { "" }
        $errorLower = $rawError.ToLowerInvariant()
        $messageLower = $rawMessage.ToLowerInvariant()
        if (($errorLower -match "timeout") -or ($messageLower -match "timeout")) {
          $result.windowHandleErrorClass = "timeout"
        } elseif (($errorLower -match "no such window") -or ($messageLower -match "no such window") -or ($messageLower -match "404")) {
          $result.windowHandleErrorClass = "no-such-window-or-404"
        } else {
          $result.windowHandleErrorClass = "webdriver-error"
        }
        $result.windowHandleErrorMessage = $rawMessage
      }
    }
  } catch {
    $result.windowHandleValue = $null
    $result.windowHandleFound = $false
    if (-not $result.windowHandleErrorClass) { $result.windowHandleErrorClass = "parse-error" }
    if (-not $result.windowHandleErrorMessage) { $result.windowHandleErrorMessage = $_.Exception.Message }
  }
  $result
}

function Invoke-WindowHandlesCountCheck([string]$sessionId) {
  $result = [ordered]@{
    handlesCheckAttempted = $false
    handlesCheckStdout = ""
    handlesCheckStderr = ""
    handlesCheckExitCode = $null
    handlesCount = $null
    handlesErrorClass = $null
    handlesErrorMessage = $null
  }
  $stdoutRaw = ""
  $outPath = [IO.Path]::GetTempFileName()
  $errPath = [IO.Path]::GetTempFileName()
  try {
    $result.handlesCheckAttempted = $true
    $args = @("--silent", "--show-error", "--max-time", "5", "$($script:driverBaseUrl)/session/$sessionId/window/handles")
    $proc = Start-Process -FilePath "curl.exe" -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput $outPath -RedirectStandardError $errPath
    $result.handlesCheckExitCode = $proc.ExitCode
    try { $result.handlesCheckStdout = [string](Get-Content -Raw -Path $outPath) } catch { $result.handlesCheckStdout = "" }
    $stdoutRaw = $result.handlesCheckStdout
    try { $result.handlesCheckStderr = [string](Get-Content -Raw -Path $errPath) } catch { $result.handlesCheckStderr = "" }
  } finally {
    try { Remove-Item $outPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $errPath -Force -ErrorAction SilentlyContinue } catch {}
  }
  if ($result.handlesCheckStdout.Length -gt 500) { $result.handlesCheckStdout = $result.handlesCheckStdout.Substring(0, 500) }
  if ($result.handlesCheckStderr.Length -gt 500) { $result.handlesCheckStderr = $result.handlesCheckStderr.Substring(0, 500) }
  if ($result.handlesCheckExitCode -ne 0) {
    $errLower = ""
    try { $errLower = ([string]$result.handlesCheckStderr).ToLowerInvariant() } catch { $errLower = "" }
    if (($result.handlesCheckExitCode -eq 28) -or ($errLower -match "timeout")) {
      $result.handlesErrorClass = "timeout"
    } else {
      $result.handlesErrorClass = "curl-error"
    }
    $result.handlesErrorMessage = [string]$result.handlesCheckStderr
  }
  try {
    if (-not [string]::IsNullOrWhiteSpace($stdoutRaw)) {
      $json = $stdoutRaw | ConvertFrom-Json -ErrorAction Stop
      if ($json -and $json.PSObject.Properties.Name -contains "value" -and $json.value -is [array]) {
        $result.handlesCount = @($json.value).Count
        $result.handlesErrorClass = $null
        $result.handlesErrorMessage = $null
      } elseif ($json -and $json.value -and $json.value.error) {
        $rawError = [string]$json.value.error
        $rawMessage = if ($json.value.message) { [string]$json.value.message } else { "" }
        $errorLower = $rawError.ToLowerInvariant()
        $messageLower = $rawMessage.ToLowerInvariant()
        if (($errorLower -match "timeout") -or ($messageLower -match "timeout")) {
          $result.handlesErrorClass = "timeout"
        } elseif (($errorLower -match "no such window") -or ($messageLower -match "no such window") -or ($messageLower -match "404")) {
          $result.handlesErrorClass = "no-such-window-or-404"
        } else {
          $result.handlesErrorClass = "webdriver-error"
        }
        $result.handlesErrorMessage = $rawMessage
      }
    }
  } catch {
    if (-not $result.handlesErrorClass) { $result.handlesErrorClass = "parse-error" }
    if (-not $result.handlesErrorMessage) { $result.handlesErrorMessage = $_.Exception.Message }
  }
  $result
}

function Invoke-CurrentUrlCheck([string]$sessionId) {
  $result = [ordered]@{
    currentUrlCheckAttempted = $false
    currentUrlFound = $false
    currentUrlValue = $null
    currentUrlErrorClass = $null
    currentUrlErrorMessage = $null
  }
  $stdoutRaw = ""
  $outPath = [IO.Path]::GetTempFileName()
  $errPath = [IO.Path]::GetTempFileName()
  try {
    $result.currentUrlCheckAttempted = $true
    $args = @("--silent", "--show-error", "--max-time", "5", "$($script:driverBaseUrl)/session/$sessionId/url")
    $proc = Start-Process -FilePath "curl.exe" -ArgumentList $args -NoNewWindow -Wait -PassThru -RedirectStandardOutput $outPath -RedirectStandardError $errPath
    try { $stdoutRaw = [string](Get-Content -Raw -Path $outPath) } catch { $stdoutRaw = "" }
    try { $stderr = [string](Get-Content -Raw -Path $errPath) } catch { $stderr = "" }
    if ($proc.ExitCode -ne 0) {
      $errLower = ""
      try { $errLower = $stderr.ToLowerInvariant() } catch { $errLower = "" }
      if (($proc.ExitCode -eq 28) -or ($errLower -match "timeout")) {
        $result.currentUrlErrorClass = "timeout"
      } else {
        $result.currentUrlErrorClass = "curl-error"
      }
      $result.currentUrlErrorMessage = $stderr
      return $result
    }
    try {
      $json = $stdoutRaw | ConvertFrom-Json -ErrorAction Stop
      if ($json -and $json.PSObject.Properties.Name -contains "value" -and $json.value -is [string]) {
        $result.currentUrlFound = $true
        $result.currentUrlValue = [string]$json.value
      } elseif ($json -and $json.value -and $json.value.error) {
        $rawError = [string]$json.value.error
        $rawMessage = if ($json.value.message) { [string]$json.value.message } else { "" }
        $errorLower = $rawError.ToLowerInvariant()
        $messageLower = $rawMessage.ToLowerInvariant()
        if (($errorLower -match "timeout") -or ($messageLower -match "timeout")) {
          $result.currentUrlErrorClass = "timeout"
        } elseif (($errorLower -match "no such window") -or ($messageLower -match "no such window") -or ($messageLower -match "404")) {
          $result.currentUrlErrorClass = "no-such-window-or-404"
        } else {
          $result.currentUrlErrorClass = "webdriver-error"
        }
        $result.currentUrlErrorMessage = $rawMessage
      } else {
        $result.currentUrlErrorClass = "parse-error"
        $result.currentUrlErrorMessage = "missing value in response"
      }
    } catch {
      $result.currentUrlErrorClass = "parse-error"
      $result.currentUrlErrorMessage = $_.Exception.Message
    }
  } finally {
    try { Remove-Item $outPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $errPath -Force -ErrorAction SilentlyContinue } catch {}
  }
  $result
}

function Wait-BrowserReady([int]$waitMs = 500) {
  Start-Sleep -Milliseconds $waitMs
}

function Open-PageWithRetry([int]$maxAttempts = 2, [int]$retryWaitMs = 700) {
  $targetUrl = "$($script:baseUrl)/wiring-diagram.html"
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
    $diagScript = @(
      'const byId = (id) => document.getElementById(id);'
      'const panel = byId("parseResultPanel");'
      'const bodyText = (document.body && document.body.innerText ? document.body.innerText : "").replace(/\s+/g, " ").slice(0, 120);'
      'return {'
      '  readyState: document.readyState || "",'
      '  href: (location && location.href) || "",'
      '  title: document.title || "",'
      '  hasBody: !!document.body,'
      '  hasProblemTextInput: !!byId("problemTextInput"),'
      '  hasParseProblemButton: !!byId("parseProblemButton"),'
      '  hasParseResultPanel: !!panel,'
      '  hasParseResultPre: !!(panel && panel.querySelector("pre")),'
      '  bodyPreview: bodyText'
      '};'
    ) -join "`n"
    Exec-Script $diagScript @() "ui-init-diagnostics"
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

function Invoke-ParseClick([string]$inputText) {
  $scriptText = @(
    'const input = document.getElementById("problemTextInput");'
    'const btn = document.getElementById("parseProblemButton");'
    'const pre = document.querySelector("#parseResultPanel pre");'
    'if (!input || !btn || !pre) return false;'
    'window.__e2eBeforeParse = (pre.textContent || "").trim();'
    'input.focus();'
    'input.value = "";'
    'input.dispatchEvent(new Event("input",{bubbles:true}));'
    'input.value = arguments[0];'
    'input.dispatchEvent(new Event("input",{bubbles:true}));'
    'input.dispatchEvent(new Event("change",{bubbles:true}));'
    'btn.click();'
    'return true;'
  ) -join "`n"
  [bool](Exec-Script $scriptText @($inputText) "e2e-parse-click")
}

function Wait-ParseResultUpdated([int]$timeoutSec = 20) {
  Wait-Until {
    $waitScript = @(
      'const pre = document.querySelector("#parseResultPanel pre");'
      'if (!pre) return false;'
      'const now = (pre.textContent || "").trim();'
      'const before = window.__e2eBeforeParse || "";'
      'return now.length > 0 && now !== before;'
    ) -join "`n"
    try {
      [bool](Exec-Script $waitScript @() "e2e-parse-wait")
    } catch {
      $false
    }
  } $timeoutSec
}

function Get-E2EUiSnapshot() {
  $uiSnapshotScript = @'
const text = (id) => {
  const el = document.getElementById(id);
  return el ? (el.textContent || "").trim() : "";
};
const parsePre = document.querySelector("#parseResultPanel pre");
const circuitList = document.getElementById("circuit-list-result");
const circuitText = text("circuit-list-result");
const materialText = text("material-list-result");
const wireLengthText = text("wire-length-result");
const aiDiagramText = text("ai-diagram-preview-result");
const fallbackTitle = "\u8907\u7dda\u56f3\u3092\u8868\u793a\u3067\u304d\u307e\u305b\u3093";
const fallbackDesc = "\u56de\u8def\u60c5\u5831\u304c\u4e0d\u8db3\u3057\u3066\u3044\u307e\u3059";
return {
  parseText: parsePre ? (parsePre.textContent || "").trim() : "",
  circuitText,
  materialText,
  wireLengthText,
  aiDiagramText,
  circuitCount: circuitList ? circuitList.querySelectorAll("li").length : 0,
  hasAiSvg: !!document.querySelector("#ai-diagram-preview-result svg"),
  hasCanvasSvg: !!document.querySelector("#diagram-canvas svg"),
  hasAnySvg: !!document.querySelector("#ai-diagram-preview-result svg, #diagram-canvas svg"),
  hasFallbackTitle: aiDiagramText.includes(fallbackTitle),
  hasFallbackDesc: aiDiagramText.includes(fallbackDesc)
};
'@
  Exec-Script $uiSnapshotScript @() "e2e-ui-snapshot"
}

function Get-SuccessUiChecks($snapshot) {
  $wireLengthLabel = Make-Japanese @(37197,32218,32207,24310,38263)
  $materialNoneLabel = Make-Japanese @(26448,26009,12394,12375)
  [ordered]@{
    circuit_list_non_empty = (-not [string]::IsNullOrWhiteSpace([string]$snapshot.circuitText))
    material_not_empty = (-not [string]::IsNullOrWhiteSpace([string]$snapshot.materialText))
    material_not_material_none = (-not ([string]$snapshot.materialText).Contains($materialNoneLabel))
    wire_length_has_label = ([string]$snapshot.wireLengthText).Contains($wireLengthLabel)
    wire_length_non_zero_optional = (-not (([string]$snapshot.wireLengthText) -match "\b0\.0\s*m\b"))
    ai_not_fallback = (-not [bool]$snapshot.hasFallbackTitle) -and (-not [bool]$snapshot.hasFallbackDesc)
    svg_present_optional = [bool]$snapshot.hasAnySvg
  }
}

function Get-FailureUiChecks($snapshot) {
  $wireLengthLabel = Make-Japanese @(37197,32218,32207,24310,38263)
  $materialNoneLabel = Make-Japanese @(26448,26009,12394,12375)
  [ordered]@{
    circuit_list_empty = [string]::IsNullOrWhiteSpace([string]$snapshot.circuitText)
    material_is_material_none = ([string]$snapshot.materialText).Contains($materialNoneLabel)
    wire_length_has_label = ([string]$snapshot.wireLengthText).Contains($wireLengthLabel)
    wire_length_is_zero = (([string]$snapshot.wireLengthText) -match "\b0\.0\s*m\b")
    ai_has_fallback_title = [bool]$snapshot.hasFallbackTitle
    ai_has_fallback_desc = [bool]$snapshot.hasFallbackDesc
  }
}

function Get-ChecksPass([object]$checks, [string[]]$requiredKeys) {
  foreach ($key in $requiredKeys) {
    if (-not [bool]$checks[$key]) { return $false }
  }
  $true
}

function Get-DownstreamContractSnapshot() {
  $downstreamSnapshotScript = @'
const txt = (id) => {
  const el = document.getElementById(id);
  return el ? (el.textContent || "").trim() : "";
};
const layoutText = txt("layout-debug-result");
const wirePathText = txt("wire-path-debug-result");
const lines = layoutText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const edgeLines = lines.filter((line) => line.includes("->"));
const nodeLines = [];
let readingNodes = false;
for (const line of lines) {
  if (line === "ノード") {
    readingNodes = true;
    continue;
  }
  if (line === "接続線") {
    readingNodes = false;
    continue;
  }
  if (readingNodes) nodeLines.push(line);
}
const roleSet = Array.from(new Set(
  edgeLines
    .map((line) => {
      const m = line.match(/\(([^()]+)\)\s*$/);
      return m ? m[1].trim() : "";
    })
    .filter(Boolean)
)).sort();
const hasJunctionNodeLeak = nodeLines.some((line) => /^j-/.test(line));
const wireSvg = document.querySelector("#wire-path-debug-result svg");
const aiSvg = document.querySelector("#ai-diagram-preview-result svg");
return {
  layoutText,
  wirePathText,
  roleSet,
  edgeCount: edgeLines.length,
  nodeCount: nodeLines.length,
  hasJunctionNodeLeak,
  hasWirePathSvg: !!wireSvg,
  wirePathPolylineCount: wireSvg ? wireSvg.querySelectorAll("polyline").length : 0,
  hasAiSvg: !!aiSvg,
  aiPolylineCount: aiSvg ? aiSvg.querySelectorAll("polyline").length : 0
};
'@
  Exec-Script $downstreamSnapshotScript @() "e2e-downstream-snapshot"
}

function Test-DownstreamContractCase([string]$name, [string]$inputText, [object]$expect) {
  Log-Step "downstream case $name parse" "start"
  $clickOk = Invoke-ParseClick $inputText
  $parseReady = if ($clickOk) { [bool](Wait-ParseResultUpdated 20) } else { $false }
  Start-Sleep -Milliseconds 700
  $snapshot = Get-DownstreamContractSnapshot
  Log-Step "downstream case $name parse" "done"

  $requiredRoles = @($expect.requiredRoles)
  $expectedEdgeCount = [int]$expect.expectedEdgeCount
  $missingRoles = @($requiredRoles | Where-Object { -not (@($snapshot.roleSet) -contains $_) })
  $checkMap = [ordered]@{
    parse_ready = [bool]$parseReady
    role_set_match = ($missingRoles.Count -eq 0)
    edge_count_match = ([int]$snapshot.edgeCount -eq $expectedEdgeCount)
    junction_not_exposed_in_layout = (-not [bool]$snapshot.hasJunctionNodeLeak)
    wirepaths_present = (([bool]$snapshot.hasWirePathSvg) -and ([int]$snapshot.wirePathPolylineCount -gt 0))
    svg_present = (([bool]$snapshot.hasAiSvg) -and ([int]$snapshot.aiPolylineCount -gt 0))
  }
  if ([bool]$expect.requireTraveler) {
    $checkMap.traveler_roles_present = ((@($snapshot.roleSet) -contains "traveler_1") -and (@($snapshot.roleSet) -contains "traveler_2"))
  }
  $failed = @($checkMap.Keys | Where-Object { -not [bool]$checkMap[$_] })

  [ordered]@{
    name = $name
    input = $inputText
    status = if ($failed.Count -eq 0) { "OK" } else { "要修正" }
    failedChecks = $failed
    checks = $checkMap
    expected = [ordered]@{
      requiredRoles = $requiredRoles
      expectedEdgeCount = $expectedEdgeCount
      requireTraveler = [bool]$expect.requireTraveler
    }
    observed = [ordered]@{
      roleSet = @($snapshot.roleSet)
      edgeCount = [int]$snapshot.edgeCount
      hasJunctionNodeLeak = [bool]$snapshot.hasJunctionNodeLeak
      hasWirePathSvg = [bool]$snapshot.hasWirePathSvg
      wirePathPolylineCount = [int]$snapshot.wirePathPolylineCount
      hasAiSvg = [bool]$snapshot.hasAiSvg
      aiPolylineCount = [int]$snapshot.aiPolylineCount
      layoutText = [string]$snapshot.layoutText
      wirePathText = [string]$snapshot.wirePathText
      missingRoles = $missingRoles
    }
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
  $script:sourceCommit = Get-SourceCommitShort
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
  $currentSessionResponse = New-Session
  Log-SessionCapabilitiesSummary $currentSessionResponse "current"
  $currentCapabilities = if ($currentSessionResponse -and $currentSessionResponse.value) { $currentSessionResponse.value.capabilities } else { $null }
  Log-Step "browser launch(session)" "done"
  Wait-BrowserReady
  Log-Step "page open" "start"
  Open-PageWithRetry
  Log-Step "page open" "done"

  $wdProbe = [ordered]@{ ok = $true; executeLayerDead = $false; results = @() }
  $minimalSessionCompare = [ordered]@{ executeSyncOk = $true; executeSyncStatus = "skipped"; capabilities = $currentCapabilities }
  $directNavigateDiagnostic = $null

  if ($skipDiagnosticsForE2E) {
    Write-Host "[stability-test] e2e-only mode: skip diagnostics and use minimal session"
    try { Remove-Session } catch {}
    $minimalForE2E = New-WebDriverSessionMinimal
    $script:sessionId = $minimalForE2E.sessionId
    $compareWithWindowProbe = ($env:STABILITY_COMPARE_WITH_WINDOW_PROBE -eq "1")
    $windowProbeControlled = ($env:STABILITY_COMPARE_WINDOW_MODES -eq "1")
    $compareWithCurrentWindowProbe = ($env:STABILITY_COMPARE_WITH_CURRENT_WINDOW_PROBE -eq "1")
    $currentWindowProbeControlled = ($env:STABILITY_COMPARE_CURRENT_WINDOW_MODES -eq "1")
    $compareWithWindowHandlesProbe = ($env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE -eq "1")
    $compareWithWindowHandlesProbeEnv = if ($null -ne $env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE) { [string]$env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE } else { $null }
    $windowHandlesTimingProbeControlled = ($env:STABILITY_COMPARE_WINDOW_HANDLES_TIMING_MODES -eq "1")
    $windowHandlesProbeControlled = (($env:STABILITY_COMPARE_WINDOW_HANDLES_MODES -eq "1") -or $windowHandlesTimingProbeControlled)
    $windowHandlesDelayMs = 0
    if ($windowHandlesTimingProbeControlled) {
      try {
        $parsedDelayMs = [int]$env:STABILITY_COMPARE_WINDOW_HANDLES_DELAY_MS
        if ($parsedDelayMs -gt 0) { $windowHandlesDelayMs = $parsedDelayMs }
      } catch {}
    }
    if ((-not $windowProbeControlled -and -not $currentWindowProbeControlled -and -not $windowHandlesProbeControlled) -or $compareWithWindowProbe -or $compareWithCurrentWindowProbe -or $compareWithWindowHandlesProbe) {
      Write-Host "[stability-test] check window handle"
      $windowCheck = Invoke-WindowHandleCheck $script:sessionId
    } else {
      Write-Host "[stability-test] check window handle skipped for compare mode"
      $windowCheck = [ordered]@{
        windowCheckAttempted = $false
        windowCheckStdout = ""
        windowCheckStderr = ""
        windowCheckExitCode = $null
        windowHandleFound = $false
        windowHandleValue = $null
        windowHandleErrorClass = $null
        windowHandleErrorMessage = $null
      }
    }
    Write-Host "[stability-test] check current url"
    $currentUrlCheck = Invoke-CurrentUrlCheck $script:sessionId
    Log-SessionCapabilitiesSummary $minimalForE2E.response "minimal-e2e-only"
    $trimNavigatePrepForProbeParentBudget = ($env:STABILITY_COMPARE_CHILD -eq "1" -and $env:STABILITY_REPEAT_CHILD -eq "1" -and [string]::IsNullOrWhiteSpace($env:STABILITY_COMPARE_NAV_MODES))
    if ($trimNavigatePrepForProbeParentBudget) {
      Wait-BrowserReady 200
      Write-Host "[stability-test] navigate prep trim wait=200ms (compare repeat child; parent WaitForExit budget before curl max-time navigate)"
    } else {
      Wait-BrowserReady 700
    }
    Write-Host "[stability-test] direct webdriver navigate"
    $navigateTargetUrl = "$($script:baseUrl)/wiring-diagram.html"
    $navigateSucceeded = $false
    $navigateErrorMessage = ""
    $navigateErrorClass = $null
    $navigateErrorType = ""
    $navigateStatusCode = $null
    $navigateResponseReceived = $false
    $navigateResponseStatusCode = $null
    $navigateHttpStatus = $null
    $navigateResponseBody = ""
    $navigateStderrSummary = ""
    $navigateTransportUsed = "curl"
    $webdriverError = $null
    $executeAttempted = $false
    $executeSucceeded = $false
    $executeResult = $null
    $executeErrorClass = $null
    $executeErrorMessage = ""
    $compareWithExecute = ($env:STABILITY_COMPARE_WITH_EXECUTE -eq "1")
    $navigateAttempted = $false
    $skipDirectNavigateForCompare = ($env:STABILITY_COMPARE_SKIP_NAVIGATE -eq "1")
    $curlNavigateAttempted = $false
    $curlNavigateSucceeded = $false
    $curlNavigateExitCode = $null
    $curlNavigateStdout = ""
    $curlNavigateStderr = ""
    $curlFileNavigateAttempted = $false
    $curlFileNavigateSucceeded = $false
    $curlFileNavigateExitCode = $null
    $curlFileNavigateStdout = ""
    $curlFileNavigateStderr = ""
    $chromeDriverStatusAttempted = $false
    $chromeDriverStatusStdout = ""
    $chromeDriverStatusStderr = ""
    $chromeDriverStatusExitCode = $null
    $sessionsCheckAttempted = $false
    $sessionsCheckStdout = ""
    $sessionsCheckStdoutRaw = ""
    $sessionsCheckStderr = ""
    $sessionsCheckExitCode = $null
    $checkedSessionId = [string]$script:sessionId
    $sessionIdFoundInSessions = $false
    $sessionsExtractedIds = @()
    $sessionsExtractedCount = 0
    $sessionIdFoundInExtractedIds = $false
    $windowCheckAttempted = $false
    $windowCheckStdout = ""
    $windowCheckStderr = ""
    $windowCheckExitCode = $null
    $windowHandleFound = $false
    $windowHandleValue = ""
    $windowHandleErrorClass = $null
    $windowHandleErrorMessage = $null
    $currentUrlCheckAttempted = $false
    $currentUrlFound = $false
    $currentUrlValue = $null
    $currentUrlErrorClass = $null
    $currentUrlErrorMessage = $null
    $postNavigateUrlCheckAttempted = $false
    $postNavigateUrlFound = $false
    $postNavigateUrlValue = $null
    $postNavigateUrlErrorClass = $null
    $postNavigateUrlErrorMessage = $null
    $currentUrlMatchesTarget = $null
    $currentUrlBeforeNavigate = $currentUrlValue
    $sessionRecovered = $false
    $sessionRecoveryReason = ""
    $recoveryOpenRetryCount = 0
    $recoveryLastOpenedUrl = ""
    $recoveryLastReadyState = ""
    $recoveryOpenReachedTarget = $false
    $urlBeforeRetry1 = $null
    $urlAfterRetry1 = $null
    $urlBeforeRetry2 = $null
    $urlAfterRetry2 = $null
    $windowBeforeRetry1 = $null
    $windowAfterRetry1 = $null
    $windowBeforeRetry2 = $null
    $windowAfterRetry2 = $null
    $handlesCountBeforeRetry1 = $null
    $handlesCountAfterRetry1 = $null
    $currentHandleBeforeRetry1 = $null
    $currentHandleAfterRetry1 = $null
    $handlesCountBeforeRetry2 = $null
    $handlesCountAfterRetry2 = $null
    $currentHandleBeforeRetry2 = $null
    $currentHandleAfterRetry2 = $null
    $retryInvokeSucceeded1 = $null
    $retryInvokeSucceeded2 = $null
    $retryInvokeError1 = $null
    $retryInvokeError2 = $null
    $navigateHttpStatus1 = $null
    $navigateResponseBody1 = $null
    $navigateStderrSummary1 = $null
    $webdriverError1 = $null
    $navigateHttpStatus2 = $null
    $navigateResponseBody2 = $null
    $navigateStderrSummary2 = $null
    $webdriverError2 = $null
    $windowProbeAttempted = $false
    $currentWindowProbeAttempted = $false
    $currentWindowHandleSucceeded = $false
    $currentWindowHandleErrorClass = $null
    $windowHandlesProbeAttempted = $false
    $windowHandlesSucceeded = $false
    $windowHandlesCount = $null
    $windowHandlesErrorClass = $null
    $runCurrentWindowProbe = ((-not $windowProbeControlled -and -not $currentWindowProbeControlled -and -not $windowHandlesProbeControlled) -or $compareWithWindowProbe -or $compareWithCurrentWindowProbe)
    $runWindowHandlesProbe = ((-not $windowProbeControlled -and -not $currentWindowProbeControlled -and -not $windowHandlesProbeControlled) -or $compareWithWindowProbe -or $compareWithWindowHandlesProbe)
    if ($runCurrentWindowProbe) {
      $windowProbeAttempted = $true
      $currentWindowProbeAttempted = $true
      $windowCheckAttempted = [bool]$windowCheck.windowCheckAttempted
      $windowCheckStdout = [string]$windowCheck.windowCheckStdout
      $windowCheckStderr = [string]$windowCheck.windowCheckStderr
      $windowCheckExitCode = $windowCheck.windowCheckExitCode
      $windowHandleFound = [bool]$windowCheck.windowHandleFound
      $windowHandleValue = if ($null -ne $windowCheck.windowHandleValue) { [string]$windowCheck.windowHandleValue } else { $null }
      $windowHandleErrorClass = if ($null -ne $windowCheck.windowHandleErrorClass) { [string]$windowCheck.windowHandleErrorClass } else { $null }
      $windowHandleErrorMessage = if ($null -ne $windowCheck.windowHandleErrorMessage) { [string]$windowCheck.windowHandleErrorMessage } else { $null }
      $currentWindowHandleSucceeded = $windowHandleFound
      $currentWindowHandleErrorClass = $windowHandleErrorClass
    }
    if ($runWindowHandlesProbe) {
      $windowProbeAttempted = $true
      $windowHandlesProbeAttempted = $true
      if ($windowHandlesDelayMs -gt 0) {
        Start-Sleep -Milliseconds $windowHandlesDelayMs
      }
      $windowHandlesCheck = Invoke-WindowHandlesCountCheck $script:sessionId
      $windowHandlesCount = if ($null -ne $windowHandlesCheck.handlesCount) { [int]$windowHandlesCheck.handlesCount } else { $null }
      $windowHandlesSucceeded = [bool]($null -ne $windowHandlesCount)
      $windowHandlesErrorClass = if ($null -ne $windowHandlesCheck.handlesErrorClass) { [string]$windowHandlesCheck.handlesErrorClass } else { $null }
    }
    if ((-not $runCurrentWindowProbe) -and (-not $runWindowHandlesProbe)) {
      Write-Host "[stability-test] window handle probe skipped for compare mode"
    }
    $currentUrlCheckAttempted = [bool]$currentUrlCheck.currentUrlCheckAttempted
    $currentUrlFound = [bool]$currentUrlCheck.currentUrlFound
    $currentUrlValue = if ($null -ne $currentUrlCheck.currentUrlValue) { [string]$currentUrlCheck.currentUrlValue } else { $null }
    $currentUrlErrorClass = if ($null -ne $currentUrlCheck.currentUrlErrorClass) { [string]$currentUrlCheck.currentUrlErrorClass } else { $null }
    $currentUrlErrorMessage = if ($null -ne $currentUrlCheck.currentUrlErrorMessage) { [string]$currentUrlCheck.currentUrlErrorMessage } else { $null }
    if ($compareWithExecute) {
      Write-Host "[stability-test] compare execute probe before direct navigate"
      $executeAttempted = $true
      try {
        $executeRaw = Exec-Script "return 1;" @() "compare-minimal-execute"
        $executeResult = [string]$executeRaw
        $executeSucceeded = ($executeResult -eq "1")
      } catch {
        $executeErrorMessage = [string]$_.Exception.Message
        $executeErrorLower = $executeErrorMessage.ToLowerInvariant()
        if ($executeErrorLower -match "timeout") {
          $executeErrorClass = "timeout"
        } elseif (($executeErrorLower -match "no such window") -or ($executeErrorLower -match "404")) {
          $executeErrorClass = "no-such-window-or-404"
        } else {
          $executeErrorClass = "other"
        }
      }
    }
    if ($trimNavigatePrepForProbeParentBudget) {
      Write-Host "[stability-test] check chromedriver status skipped (compare repeat child; defer to navigate session-sync + parent time budget)"
      $chromeDriverStatusAttempted = $false
      $chromeDriverStatusStdout = ""
      $chromeDriverStatusStderr = ""
      $chromeDriverStatusExitCode = $null
      Write-Host "[stability-test] check sessions list skipped (compare repeat child; defer to navigate session-sync + parent time budget)"
      $sessionsCheckAttempted = $false
      $sessionsCheckStdout = ""
      $sessionsCheckStdoutRaw = ""
      $sessionsCheckStderr = ""
      $sessionsCheckExitCode = $null
      $sessionIdFoundInSessions = $false
      Write-Host "[stability-test] extract session ids from /sessions skipped (compare repeat child; defer to navigate session-sync + parent time budget)"
      $sessionsExtractedIds = @()
      $sessionsExtractedCount = 0
      $sessionIdFoundInExtractedIds = $false
    } else {
      Write-Host "[stability-test] check chromedriver status"
      $chromeStatusOutPath = [IO.Path]::GetTempFileName()
      $chromeStatusErrPath = [IO.Path]::GetTempFileName()
      try {
        $chromeDriverStatusAttempted = $true
        $statusArgs = @("--silent", "--show-error", "--max-time", "3", "$($script:driverBaseUrl)/status")
        $statusProc = Start-Process -FilePath "curl.exe" -ArgumentList $statusArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $chromeStatusOutPath -RedirectStandardError $chromeStatusErrPath
        $chromeDriverStatusExitCode = $statusProc.ExitCode
        try { $chromeDriverStatusStdout = [string](Get-Content -Raw -Path $chromeStatusOutPath) } catch { $chromeDriverStatusStdout = "" }
        try { $chromeDriverStatusStderr = [string](Get-Content -Raw -Path $chromeStatusErrPath) } catch { $chromeDriverStatusStderr = "" }
      } finally {
        try { Remove-Item $chromeStatusOutPath -Force -ErrorAction SilentlyContinue } catch {}
        try { Remove-Item $chromeStatusErrPath -Force -ErrorAction SilentlyContinue } catch {}
      }
      if ($chromeDriverStatusStdout.Length -gt 500) { $chromeDriverStatusStdout = $chromeDriverStatusStdout.Substring(0, 500) }
      if ($chromeDriverStatusStderr.Length -gt 500) { $chromeDriverStatusStderr = $chromeDriverStatusStderr.Substring(0, 500) }
      Write-Host "[stability-test] check sessions list"
      $sessionStatusOutPath = [IO.Path]::GetTempFileName()
      $sessionStatusErrPath = [IO.Path]::GetTempFileName()
      try {
        $sessionsCheckAttempted = $true
        $sessionArgs = @("--silent", "--show-error", "--max-time", "3", "$($script:driverBaseUrl)/sessions")
        $sessionProc = Start-Process -FilePath "curl.exe" -ArgumentList $sessionArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $sessionStatusOutPath -RedirectStandardError $sessionStatusErrPath
        $sessionsCheckExitCode = $sessionProc.ExitCode
        try { $sessionsCheckStdout = [string](Get-Content -Raw -Path $sessionStatusOutPath) } catch { $sessionsCheckStdout = "" }
        $sessionsCheckStdoutRaw = $sessionsCheckStdout
        try { $sessionsCheckStderr = [string](Get-Content -Raw -Path $sessionStatusErrPath) } catch { $sessionsCheckStderr = "" }
      } finally {
        try { Remove-Item $sessionStatusOutPath -Force -ErrorAction SilentlyContinue } catch {}
        try { Remove-Item $sessionStatusErrPath -Force -ErrorAction SilentlyContinue } catch {}
      }
      if ($sessionsCheckStdout.Length -gt 500) { $sessionsCheckStdout = $sessionsCheckStdout.Substring(0, 500) }
      if ($sessionsCheckStderr.Length -gt 500) { $sessionsCheckStderr = $sessionsCheckStderr.Substring(0, 500) }
      $sessionIdFoundInSessions = (-not [string]::IsNullOrWhiteSpace($checkedSessionId)) -and $sessionsCheckStdout.Contains($checkedSessionId)
      Write-Host "[stability-test] extract session ids from /sessions"
      try {
        if (-not [string]::IsNullOrWhiteSpace($sessionsCheckStdoutRaw)) {
          $sessionsJson = $sessionsCheckStdoutRaw | ConvertFrom-Json -ErrorAction Stop
          $idBag = New-Object System.Collections.Generic.List[string]
          if ($sessionsJson -and $sessionsJson.value) {
            $valueList = @($sessionsJson.value)
            foreach ($entry in $valueList) {
              if ($entry -and $entry.id) { $idBag.Add([string]$entry.id) }
              if ($entry -and $entry.sessionId) { $idBag.Add([string]$entry.sessionId) }
            }
          }
          $sessionsExtractedIds = @($idBag | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
        }
      } catch {
        $sessionsExtractedIds = @()
      }
      $sessionsExtractedCount = @($sessionsExtractedIds).Count
      $sessionIdFoundInExtractedIds = (-not [string]::IsNullOrWhiteSpace($checkedSessionId)) -and (@($sessionsExtractedIds) -contains $checkedSessionId)
    }
    $directNavBody = @{ url = $navigateTargetUrl } | ConvertTo-Json -Compress
    if ($skipDirectNavigateForCompare) {
      Write-Host "[stability-test] direct webdriver navigate skipped for compare mode"
      $directNavigateResult = [ordered]@{
        ok = $false
        exitCode = -2
        httpStatus = $null
        responseBody = ""
        stderrSummary = "skipped by compare mode"
        webdriverError = $null
        errorClass = "skipped-by-compare"
        errorMessage = "direct webdriver navigate skipped"
        transportUsed = "skipped"
        maxTimeSecApplied = $null
      }
    } else {
      $navigateAttempted = $true
      $directNavigateResult = Invoke-SessionNavigateViaCurl $script:sessionId $navigateTargetUrl 20
    }
    $script:lastNavigateAttempt = $directNavigateResult
    $navigateTransportUsed = [string]$directNavigateResult.transportUsed
    $navigateHttpStatus = $directNavigateResult.httpStatus
    $navigateResponseBody = if ($null -ne $directNavigateResult.responseBody) { [string]$directNavigateResult.responseBody } else { "" }
    $navigateStderrSummary = if ($null -ne $directNavigateResult.stderrSummary) { [string]$directNavigateResult.stderrSummary } else { "" }
    $webdriverError = if ($null -ne $directNavigateResult.webdriverError) { [string]$directNavigateResult.webdriverError } else { $null }
    $navigateResponseReceived = ($directNavigateResult.exitCode -eq 0)
    if ($null -ne $navigateHttpStatus) {
      $navigateResponseStatusCode = [int]$navigateHttpStatus
      $navigateStatusCode = [int]$navigateHttpStatus
    }
    if ($directNavigateResult.ok) {
      $navigateSucceeded = $true
    } else {
      $navigateErrorClass = if ($directNavigateResult.errorClass) { [string]$directNavigateResult.errorClass } else { "webdriver-error" }
      $navigateErrorMessage = if ($directNavigateResult.errorMessage) { [string]$directNavigateResult.errorMessage } else { "navigate failed" }
      $navigateErrorType = "CurlNavigateError"
    }
    $postNavigateUrlCheck = Invoke-CurrentUrlCheck $script:sessionId
    $postNavigateUrlCheckAttempted = [bool]$postNavigateUrlCheck.currentUrlCheckAttempted
    $postNavigateUrlFound = [bool]$postNavigateUrlCheck.currentUrlFound
    $postNavigateUrlValue = if ($null -ne $postNavigateUrlCheck.currentUrlValue) { [string]$postNavigateUrlCheck.currentUrlValue } else { $null }
    $postNavigateUrlErrorClass = if ($null -ne $postNavigateUrlCheck.currentUrlErrorClass) { [string]$postNavigateUrlCheck.currentUrlErrorClass } else { $null }
    $postNavigateUrlErrorMessage = if ($null -ne $postNavigateUrlCheck.currentUrlErrorMessage) { [string]$postNavigateUrlCheck.currentUrlErrorMessage } else { $null }
    if (($null -ne $navigateTargetUrl) -and ($null -ne $postNavigateUrlValue)) {
      $currentUrlMatchesTarget = [bool]([string]$navigateTargetUrl -eq [string]$postNavigateUrlValue)
    }
    $urlIsDataBlank = (-not [string]::IsNullOrWhiteSpace([string]$currentUrlValue)) -and ([string]$currentUrlValue).StartsWith("data:")
    $needsSessionRecovery =
      ($navigateErrorClass -eq "no-such-window-or-404") -or
      ($currentUrlErrorClass -eq "no-such-window-or-404") -or
      ((($navigateErrorClass -eq "timeout") -or ($postNavigateUrlErrorClass -eq "timeout")) -and $urlIsDataBlank) -or
      ($windowProbeAttempted -and (-not $currentWindowHandleSucceeded))
    if ($needsSessionRecovery) {
      $sessionRecoveryReason = if ($urlIsDataBlank) { "navigate timeout on data url before UI init" } else { "session invalidated before UI init" }
      Write-Host "[stability-test] session recovery start reason=$sessionRecoveryReason"
      try { Remove-Session } catch {}
      if ($navigateErrorClass -eq "timeout") {
        $oldDriverPort = $script:driverPort
        Write-Host "[stability-test] driver recycle start reason=navigate timeout"
        Stop-Driver
        $script:driverPort = Get-AvailablePort $driverPortCandidates
        $script:driverBaseUrl = "http://127.0.0.1:$($script:driverPort)"
        Start-Driver
        Write-Host "[stability-test] driver recycle done oldPort=$oldDriverPort newPort=$($script:driverPort)"
      }
      $minimalRecovered = New-WebDriverSessionMinimal
      $script:sessionId = $minimalRecovered.sessionId
      Log-SessionCapabilitiesSummary $minimalRecovered.response "minimal-e2e-recovered"
      $checkedSessionId = [string]$script:sessionId
      Wait-BrowserReady 500
      $windowCheck = Invoke-WindowHandleCheck $script:sessionId
      $currentUrlCheck = Invoke-CurrentUrlCheck $script:sessionId
      $windowCheckAttempted = [bool]$windowCheck.windowCheckAttempted
      $windowCheckStdout = [string]$windowCheck.windowCheckStdout
      $windowCheckStderr = [string]$windowCheck.windowCheckStderr
      $windowCheckExitCode = $windowCheck.windowCheckExitCode
      $windowHandleFound = [bool]$windowCheck.windowHandleFound
      $windowHandleValue = if ($null -ne $windowCheck.windowHandleValue) { [string]$windowCheck.windowHandleValue } else { $null }
      $windowHandleErrorClass = if ($null -ne $windowCheck.windowHandleErrorClass) { [string]$windowCheck.windowHandleErrorClass } else { $null }
      $windowHandleErrorMessage = if ($null -ne $windowCheck.windowHandleErrorMessage) { [string]$windowCheck.windowHandleErrorMessage } else { $null }
      $currentUrlCheckAttempted = [bool]$currentUrlCheck.currentUrlCheckAttempted
      $currentUrlFound = [bool]$currentUrlCheck.currentUrlFound
      $currentUrlValue = if ($null -ne $currentUrlCheck.currentUrlValue) { [string]$currentUrlCheck.currentUrlValue } else { $null }
      $currentUrlErrorClass = if ($null -ne $currentUrlCheck.currentUrlErrorClass) { [string]$currentUrlCheck.currentUrlErrorClass } else { $null }
      $currentUrlErrorMessage = if ($null -ne $currentUrlCheck.currentUrlErrorMessage) { [string]$currentUrlCheck.currentUrlErrorMessage } else { $null }
      $sessionRecovered = $true
      Write-Host "[stability-test] session recovery done currentUrl=$currentUrlValue windowHandleFound=$windowHandleFound"
      for ($openRetry = 1; $openRetry -le 2; $openRetry++) {
        $recoveryOpenRetryCount = $openRetry
        $beforeHandlesState = Invoke-WindowHandlesCountCheck $script:sessionId
        $beforeUrlState = Invoke-CurrentUrlCheck $script:sessionId
        $beforeWindowState = Invoke-WindowHandleCheck $script:sessionId
        $beforeUrlValue = if ($beforeUrlState.currentUrlFound -and $beforeUrlState.currentUrlValue) { [string]$beforeUrlState.currentUrlValue } else { $null }
        $beforeWindowValue = if ($beforeWindowState.windowHandleFound -and $beforeWindowState.windowHandleValue) { [string]$beforeWindowState.windowHandleValue } else { "missing:$([string]$beforeWindowState.windowHandleErrorClass)" }
        $beforeHandlesCount = if ($null -ne $beforeHandlesState.handlesCount) { [int]$beforeHandlesState.handlesCount } else { $null }
        if ($openRetry -eq 1) {
          $urlBeforeRetry1 = $beforeUrlValue
          $windowBeforeRetry1 = $beforeWindowValue
          $handlesCountBeforeRetry1 = $beforeHandlesCount
          $currentHandleBeforeRetry1 = if ($beforeWindowState.windowHandleFound -and $beforeWindowState.windowHandleValue) { [string]$beforeWindowState.windowHandleValue } else { $null }
        } else {
          $urlBeforeRetry2 = $beforeUrlValue
          $windowBeforeRetry2 = $beforeWindowValue
          $handlesCountBeforeRetry2 = $beforeHandlesCount
          $currentHandleBeforeRetry2 = if ($beforeWindowState.windowHandleFound -and $beforeWindowState.windowHandleValue) { [string]$beforeWindowState.windowHandleValue } else { $null }
        }
        Write-Host "[stability-test] recovered session page-open retry=$openRetry"
        $retryInvokeSucceeded = $false
        $retryInvokeError = $null
        try {
          Open-PageWithRetry 1 300
          $retryInvokeSucceeded = $true
        } catch {
          $retryInvokeError = [string]$_.Exception.Message
          Write-Host "[stability-test] recovered session Open-PageWithRetry failed retry=$openRetry message=$($_.Exception.Message)"
        }
        if ($openRetry -eq 1) {
          $retryInvokeSucceeded1 = $retryInvokeSucceeded
          $retryInvokeError1 = $retryInvokeError
          $navigateHttpStatus1 = if ($script:lastNavigateAttempt) { $script:lastNavigateAttempt.httpStatus } else { $null }
          $navigateResponseBody1 = if ($script:lastNavigateAttempt -and $null -ne $script:lastNavigateAttempt.responseBody) { [string]$script:lastNavigateAttempt.responseBody } else { $null }
          $navigateStderrSummary1 = if ($script:lastNavigateAttempt -and $null -ne $script:lastNavigateAttempt.stderrSummary) { [string]$script:lastNavigateAttempt.stderrSummary } else { $null }
          $webdriverError1 = if ($script:lastNavigateAttempt -and $null -ne $script:lastNavigateAttempt.webdriverError) { [string]$script:lastNavigateAttempt.webdriverError } else { $null }
        } else {
          $retryInvokeSucceeded2 = $retryInvokeSucceeded
          $retryInvokeError2 = $retryInvokeError
          $navigateHttpStatus2 = if ($script:lastNavigateAttempt) { $script:lastNavigateAttempt.httpStatus } else { $null }
          $navigateResponseBody2 = if ($script:lastNavigateAttempt -and $null -ne $script:lastNavigateAttempt.responseBody) { [string]$script:lastNavigateAttempt.responseBody } else { $null }
          $navigateStderrSummary2 = if ($script:lastNavigateAttempt -and $null -ne $script:lastNavigateAttempt.stderrSummary) { [string]$script:lastNavigateAttempt.stderrSummary } else { $null }
          $webdriverError2 = if ($script:lastNavigateAttempt -and $null -ne $script:lastNavigateAttempt.webdriverError) { [string]$script:lastNavigateAttempt.webdriverError } else { $null }
        }
        Wait-BrowserReady 350
        $handlesAfterOpen = Invoke-WindowHandlesCountCheck $script:sessionId
        $urlAfterOpen = Invoke-CurrentUrlCheck $script:sessionId
        $windowAfterOpen = Invoke-WindowHandleCheck $script:sessionId
        $uiAfterOpen = Get-UiInitDiagnostics
        $recoveryLastOpenedUrl = if ($urlAfterOpen.currentUrlFound -and $urlAfterOpen.currentUrlValue) { [string]$urlAfterOpen.currentUrlValue } else { [string]$uiAfterOpen.href }
        $afterWindowValue = if ($windowAfterOpen.windowHandleFound -and $windowAfterOpen.windowHandleValue) { [string]$windowAfterOpen.windowHandleValue } else { "missing:$([string]$windowAfterOpen.windowHandleErrorClass)" }
        $afterHandlesCount = if ($null -ne $handlesAfterOpen.handlesCount) { [int]$handlesAfterOpen.handlesCount } else { $null }
        if ($openRetry -eq 1) {
          $urlAfterRetry1 = $recoveryLastOpenedUrl
          $windowAfterRetry1 = $afterWindowValue
          $handlesCountAfterRetry1 = $afterHandlesCount
          $currentHandleAfterRetry1 = if ($windowAfterOpen.windowHandleFound -and $windowAfterOpen.windowHandleValue) { [string]$windowAfterOpen.windowHandleValue } else { $null }
        } else {
          $urlAfterRetry2 = $recoveryLastOpenedUrl
          $windowAfterRetry2 = $afterWindowValue
          $handlesCountAfterRetry2 = $afterHandlesCount
          $currentHandleAfterRetry2 = if ($windowAfterOpen.windowHandleFound -and $windowAfterOpen.windowHandleValue) { [string]$windowAfterOpen.windowHandleValue } else { $null }
        }
        $recoveryLastReadyState = [string]$uiAfterOpen.readyState
        $recoveryOpenReachedTarget =
          ($recoveryLastOpenedUrl.Contains("wiring-diagram.html")) -and
          (($recoveryLastReadyState -eq "interactive") -or ($recoveryLastReadyState -eq "complete"))
        Write-Host "[stability-test] recovered session open-state retry=$openRetry url=$recoveryLastOpenedUrl readyState=$recoveryLastReadyState reachedTarget=$recoveryOpenReachedTarget"
        if ($recoveryOpenReachedTarget) { break }
      }
    }
    Wait-BrowserReady 350
    $hrefAfterDirectNavigate = ""
    try { $hrefAfterDirectNavigate = [string](Exec-Script "return String(location.href || '');" @() "e2e-only-href-direct-navigate") } catch { $hrefAfterDirectNavigate = "" }
    Write-Host "[stability-test] href after direct navigate=$hrefAfterDirectNavigate"
    $curlNavigateAttempted = $true
    $curlOutPath = [IO.Path]::GetTempFileName()
    $curlErrPath = [IO.Path]::GetTempFileName()
    try {
      $curlArgs = @("--silent", "--show-error", "--max-time", "20", "-X", "POST", "-H", "Content-Type:application/json", "--data-binary", $directNavBody, "$($script:driverBaseUrl)/session/$($script:sessionId)/url")
      $curlProc = Start-Process -FilePath "curl.exe" -ArgumentList $curlArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $curlOutPath -RedirectStandardError $curlErrPath
      $curlNavigateExitCode = $curlProc.ExitCode
      $curlNavigateSucceeded = ($curlProc.ExitCode -eq 0)
      try { $curlNavigateStdout = [string](Get-Content -Raw -Path $curlOutPath) } catch { $curlNavigateStdout = "" }
      try { $curlNavigateStderr = [string](Get-Content -Raw -Path $curlErrPath) } catch { $curlNavigateStderr = "" }
    } catch {
      $curlNavigateExitCode = -1
      $curlNavigateStderr = $_.Exception.Message
    } finally {
      try { Remove-Item $curlOutPath -Force -ErrorAction SilentlyContinue } catch {}
      try { Remove-Item $curlErrPath -Force -ErrorAction SilentlyContinue } catch {}
    }
    if ($curlNavigateStdout.Length -gt 500) { $curlNavigateStdout = $curlNavigateStdout.Substring(0, 500) }
    if ($curlNavigateStderr.Length -gt 500) { $curlNavigateStderr = $curlNavigateStderr.Substring(0, 500) }
    Wait-BrowserReady 300
    $hrefAfterCurlNavigate = ""
    try { $hrefAfterCurlNavigate = [string](Exec-Script "return String(location.href || '');" @() "e2e-only-href-curl-navigate") } catch { $hrefAfterCurlNavigate = "" }
    $curlFileNavigateAttempted = $true
    $curlFileOutPath = [IO.Path]::GetTempFileName()
    $curlFileErrPath = [IO.Path]::GetTempFileName()
    $curlBodyPath = [IO.Path]::GetTempFileName()
    try {
      [IO.File]::WriteAllText($curlBodyPath, $directNavBody, [Text.UTF8Encoding]::new($false))
      $curlFileArgs = @("--silent", "--show-error", "--max-time", "20", "-X", "POST", "-H", "Content-Type:application/json", "--data-binary", "@$curlBodyPath", "$($script:driverBaseUrl)/session/$($script:sessionId)/url")
      $curlFileProc = Start-Process -FilePath "curl.exe" -ArgumentList $curlFileArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput $curlFileOutPath -RedirectStandardError $curlFileErrPath
      $curlFileNavigateExitCode = $curlFileProc.ExitCode
      $curlFileNavigateSucceeded = ($curlFileProc.ExitCode -eq 0)
      try { $curlFileNavigateStdout = [string](Get-Content -Raw -Path $curlFileOutPath) } catch { $curlFileNavigateStdout = "" }
      try { $curlFileNavigateStderr = [string](Get-Content -Raw -Path $curlFileErrPath) } catch { $curlFileNavigateStderr = "" }
    } catch {
      $curlFileNavigateExitCode = -1
      $curlFileNavigateStderr = $_.Exception.Message
    } finally {
      try { Remove-Item $curlBodyPath -Force -ErrorAction SilentlyContinue } catch {}
      try { Remove-Item $curlFileOutPath -Force -ErrorAction SilentlyContinue } catch {}
      try { Remove-Item $curlFileErrPath -Force -ErrorAction SilentlyContinue } catch {}
    }
    if ($curlFileNavigateStdout.Length -gt 500) { $curlFileNavigateStdout = $curlFileNavigateStdout.Substring(0, 500) }
    if ($curlFileNavigateStderr.Length -gt 500) { $curlFileNavigateStderr = $curlFileNavigateStderr.Substring(0, 500) }
    Wait-BrowserReady 300
    $hrefAfterCurlFileNavigate = ""
    try { $hrefAfterCurlFileNavigate = [string](Exec-Script "return String(location.href || '');" @() "e2e-only-href-curl-file-navigate") } catch { $hrefAfterCurlFileNavigate = "" }
    $preUiState = Get-UiInitDiagnostics
    if ($compareWithWindowHandlesProbe -and (-not $windowHandlesProbeAttempted)) {
      $windowProbeAttempted = $true
      $windowHandlesProbeAttempted = $true
      if ($windowHandlesDelayMs -gt 0) {
        Start-Sleep -Milliseconds $windowHandlesDelayMs
      }
      $windowHandlesCheck = Invoke-WindowHandlesCountCheck $script:sessionId
      $windowHandlesCount = if ($null -ne $windowHandlesCheck.handlesCount) { [int]$windowHandlesCheck.handlesCount } else { $null }
      $windowHandlesSucceeded = [bool]($null -ne $windowHandlesCount)
      $windowHandlesErrorClass = if ($null -ne $windowHandlesCheck.handlesErrorClass) { [string]$windowHandlesCheck.handlesErrorClass } else { $null }
    }
    $runType = "timeout_only"
    foreach ($we in @($webdriverError, $webdriverError1, $webdriverError2)) {
      if (-not [string]::IsNullOrWhiteSpace([string]$we)) {
        $runType = "mixed_webdriver_error"
        break
      }
    }
    $directNavigateDiagnostic = [ordered]@{
      phase = "direct-webdriver-navigate"
      navigateTargetUrl = $navigateTargetUrl
      navigateMaxTimeSec = if ($null -ne $directNavigateResult.maxTimeSecApplied) { $directNavigateResult.maxTimeSecApplied } else { $null }
      navigateAttempted = $navigateAttempted
      navigateResponseReceived = $navigateResponseReceived
      navigateResponseStatusCode = $navigateResponseStatusCode
      navigateHttpStatus = $navigateHttpStatus
      navigateSucceeded = $navigateSucceeded
      navigateErrorClass = $navigateErrorClass
      navigateErrorMessage = $navigateErrorMessage
      navigateErrorType = $navigateErrorType
      navigateStatusCode = $navigateStatusCode
      navigateResponseBody = $navigateResponseBody
      navigateStderrSummary = $navigateStderrSummary
      navigateTransportUsed = $navigateTransportUsed
      webdriverError = $webdriverError
      executeAttempted = $executeAttempted
      executeSucceeded = $executeSucceeded
      executeResult = $executeResult
      executeErrorClass = $executeErrorClass
      executeErrorMessage = $executeErrorMessage
      windowProbeAttempted = $windowProbeAttempted
      currentWindowProbeAttempted = $currentWindowProbeAttempted
      currentWindowHandleSucceeded = $currentWindowHandleSucceeded
      currentWindowHandleErrorClass = $currentWindowHandleErrorClass
      windowHandlesProbeAttempted = $windowHandlesProbeAttempted
      windowHandlesSucceeded = $windowHandlesSucceeded
      windowHandlesCount = $windowHandlesCount
      windowHandlesErrorClass = $windowHandlesErrorClass
      compareWithWindowHandlesProbe = $compareWithWindowHandlesProbe
      runWindowHandlesProbe = $runWindowHandlesProbe
      windowHandlesTimingProbeControlled = $windowHandlesTimingProbeControlled
      compareWithWindowHandlesProbeEnv = $compareWithWindowHandlesProbeEnv
      windowHandlesDelayMs = $windowHandlesDelayMs
      runType = $runType
      postNavigateUrlCheckAttempted = $postNavigateUrlCheckAttempted
      postNavigateUrlFound = $postNavigateUrlFound
      postNavigateUrlValue = $postNavigateUrlValue
      postNavigateUrlErrorClass = $postNavigateUrlErrorClass
      postNavigateUrlErrorMessage = $postNavigateUrlErrorMessage
      currentUrlMatchesTarget = $currentUrlMatchesTarget
      hrefAfterDirectNavigate = $hrefAfterDirectNavigate
      curlNavigateAttempted = $curlNavigateAttempted
      curlNavigateSucceeded = $curlNavigateSucceeded
      curlNavigateExitCode = $curlNavigateExitCode
      curlNavigateStdout = $curlNavigateStdout
      curlNavigateStderr = $curlNavigateStderr
      hrefAfterCurlNavigate = $hrefAfterCurlNavigate
      curlFileNavigateAttempted = $curlFileNavigateAttempted
      curlFileNavigateSucceeded = $curlFileNavigateSucceeded
      curlFileNavigateExitCode = $curlFileNavigateExitCode
      curlFileNavigateStdout = $curlFileNavigateStdout
      curlFileNavigateStderr = $curlFileNavigateStderr
      hrefAfterCurlFileNavigate = $hrefAfterCurlFileNavigate
      chromeDriverStatusAttempted = $chromeDriverStatusAttempted
      chromeDriverStatusStdout = $chromeDriverStatusStdout
      chromeDriverStatusStderr = $chromeDriverStatusStderr
      chromeDriverStatusExitCode = $chromeDriverStatusExitCode
      sessionsCheckAttempted = $sessionsCheckAttempted
      sessionsCheckStdout = $sessionsCheckStdout
      sessionsCheckStderr = $sessionsCheckStderr
      sessionsCheckExitCode = $sessionsCheckExitCode
      checkedSessionId = $checkedSessionId
      sessionIdFoundInSessions = $sessionIdFoundInSessions
      sessionsExtractedIds = $sessionsExtractedIds
      sessionsExtractedCount = $sessionsExtractedCount
      sessionIdFoundInExtractedIds = $sessionIdFoundInExtractedIds
      windowCheckAttempted = $windowCheckAttempted
      windowCheckStdout = $windowCheckStdout
      windowCheckStderr = $windowCheckStderr
      windowCheckExitCode = $windowCheckExitCode
      windowHandleFound = $windowHandleFound
      windowHandleValue = $windowHandleValue
      windowHandleErrorClass = $windowHandleErrorClass
      windowHandleErrorMessage = $windowHandleErrorMessage
      currentUrlCheckAttempted = $currentUrlCheckAttempted
      currentUrlFound = $currentUrlFound
      currentUrlBeforeNavigate = $currentUrlBeforeNavigate
      currentUrlValue = $currentUrlValue
      currentUrlErrorClass = $currentUrlErrorClass
      currentUrlErrorMessage = $currentUrlErrorMessage
      preUiHref = [string]$preUiState.href
      preUiReadyState = [string]$preUiState.readyState
      preUiTitle = [string]$preUiState.title
      preUiBodyPreview = [string]$preUiState.bodyPreview
      sessionRecovered = $sessionRecovered
      sessionRecoveryReason = $sessionRecoveryReason
      retryCount = $recoveryOpenRetryCount
      lastOpenedUrl = $recoveryLastOpenedUrl
      lastReadyState = $recoveryLastReadyState
      recoveryOpenReachedTarget = $recoveryOpenReachedTarget
      urlBeforeRetry1 = $urlBeforeRetry1
      urlAfterRetry1 = $urlAfterRetry1
      urlBeforeRetry2 = $urlBeforeRetry2
      urlAfterRetry2 = $urlAfterRetry2
      windowBeforeRetry1 = $windowBeforeRetry1
      windowAfterRetry1 = $windowAfterRetry1
      windowBeforeRetry2 = $windowBeforeRetry2
      windowAfterRetry2 = $windowAfterRetry2
      handlesCountBeforeRetry1 = $handlesCountBeforeRetry1
      handlesCountAfterRetry1 = $handlesCountAfterRetry1
      currentHandleBeforeRetry1 = $currentHandleBeforeRetry1
      currentHandleAfterRetry1 = $currentHandleAfterRetry1
      handlesCountBeforeRetry2 = $handlesCountBeforeRetry2
      handlesCountAfterRetry2 = $handlesCountAfterRetry2
      currentHandleBeforeRetry2 = $currentHandleBeforeRetry2
      currentHandleAfterRetry2 = $currentHandleAfterRetry2
      retryInvokeSucceeded1 = $retryInvokeSucceeded1
      retryInvokeSucceeded2 = $retryInvokeSucceeded2
      retryInvokeError1 = $retryInvokeError1
      retryInvokeError2 = $retryInvokeError2
      navigateHttpStatus1 = $navigateHttpStatus1
      navigateResponseBody1 = $navigateResponseBody1
      navigateStderrSummary1 = $navigateStderrSummary1
      webdriverError1 = $webdriverError1
      navigateHttpStatus2 = $navigateHttpStatus2
      navigateResponseBody2 = $navigateResponseBody2
      navigateStderrSummary2 = $navigateStderrSummary2
      webdriverError2 = $webdriverError2
      timestamp = (Get-Date).ToString("o")
    }
    Write-OutputJson @{ preUiInitDiagnostic = $directNavigateDiagnostic } 8
    if ((-not $recoveryOpenReachedTarget) -and (-not (Open-PageViaCurl $script:sessionId 25))) {
      Write-Host "[stability-test] minimal curl page-open failed; retry with recovered minimal session"
      try { Remove-Session } catch {}
      $minimalRecovered = New-WebDriverSessionMinimal
      $script:sessionId = $minimalRecovered.sessionId
      Log-SessionCapabilitiesSummary $minimalRecovered.response "minimal-e2e-recovered-open-page"
      Wait-BrowserReady 500
      if ((-not $recoveryOpenReachedTarget) -and (-not (Open-PageViaCurl $script:sessionId 25))) {
        throw "Minimal session page-open failed in e2e-only mode."
      }
    }
    $hrefProbe = ""
    try { $hrefProbe = [string](Exec-Script "return String(location.href || '');" @() "e2e-only-href-probe") } catch { $hrefProbe = "" }
    if ($hrefProbe.StartsWith("data:")) {
      Write-Host "[stability-test] retry open page because url is data:"
      for ($retry = 1; $retry -le 3; $retry++) {
        Open-PageViaCurl $script:sessionId 10 | Out-Null
        Wait-BrowserReady 350
        try { $hrefProbe = [string](Exec-Script "return String(location.href || '');" @() "e2e-only-href-retry") } catch { $hrefProbe = "" }
        if ($hrefProbe.Contains("wiring-diagram.html")) {
          Write-Host "[stability-test] page open retry success"
          break
        }
      }
      if ($hrefProbe.StartsWith("data:")) {
        Write-Host "[stability-test] fallback to Open-PageWithRetry because url is still data:"
        try {
          Open-PageWithRetry 1 300
        } catch {
          $preDiag = Get-UiInitDiagnostics
          $executeSyncErrorMessage = if ($preDiag.error) { [string]$preDiag.error } else { "" }
          $executeSyncErrorClass = "other"
          $timeoutJa = Make-Japanese @(12479,12452,12512,12450,12454,12488)
          $executeSyncErrorLower = $executeSyncErrorMessage.ToLowerInvariant()
          if (($executeSyncErrorLower -match 'timeout') -or $executeSyncErrorMessage.Contains($timeoutJa)) {
            $executeSyncErrorClass = "timeout"
          } elseif (($executeSyncErrorLower -match 'no such window') -or ($executeSyncErrorLower -match '404')) {
            $executeSyncErrorClass = "no-such-window-or-404"
          }
          $preUiInitDiagnostic = [ordered]@{
            phase = "pre-ui-init-diagnostic"
            href = [string]$preDiag.href
            readyState = [string]$preDiag.readyState
            title = [string]$preDiag.title
            bodyPreview = [string]$preDiag.bodyPreview
            hasProblemTextInput = [bool]$preDiag.hasProblemTextInput
            hasParseProblemButton = [bool]$preDiag.hasParseProblemButton
            hasParseResultPanel = [bool]$preDiag.hasParseResultPanel
            hasParseResultPre = [bool]$preDiag.hasParseResultPre
            navigateTargetUrl = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateTargetUrl } else { "" }
            navigateAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.navigateAttempted } else { $false }
            navigateResponseReceived = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.navigateResponseReceived } else { $false }
            navigateResponseStatusCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.navigateResponseStatusCode } else { $null }
            navigateHttpStatus = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.navigateHttpStatus } else { $null }
            navigateSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.navigateSucceeded } else { $false }
            navigateErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.navigateErrorClass) { [string]$directNavigateDiagnostic.navigateErrorClass } else { $null }
            navigateErrorMessage = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateErrorMessage } else { "" }
            navigateErrorType = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateErrorType } else { "" }
            navigateStatusCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.navigateStatusCode } else { $null }
            navigateResponseBody = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateResponseBody } else { "" }
            navigateStderrSummary = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateStderrSummary } else { "" }
            navigateTransportUsed = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateTransportUsed } else { "" }
            webdriverError = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.webdriverError) { [string]$directNavigateDiagnostic.webdriverError } else { $null }
            executeAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.executeAttempted } else { $false }
            executeSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.executeSucceeded } else { $false }
            executeResult = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.executeResult) { [string]$directNavigateDiagnostic.executeResult } else { $null }
            executeErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.executeErrorClass) { [string]$directNavigateDiagnostic.executeErrorClass } else { $null }
            executeErrorMessage = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.executeErrorMessage) { [string]$directNavigateDiagnostic.executeErrorMessage } else { "" }
            windowProbeAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowProbeAttempted } else { $false }
            currentWindowProbeAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.currentWindowProbeAttempted } else { $false }
            currentWindowHandleSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.currentWindowHandleSucceeded } else { $false }
            currentWindowHandleErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentWindowHandleErrorClass) { [string]$directNavigateDiagnostic.currentWindowHandleErrorClass } else { $null }
            windowHandlesProbeAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowHandlesProbeAttempted } else { $false }
            windowHandlesSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowHandlesSucceeded } else { $false }
            windowHandlesCount = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandlesCount) { [int]$directNavigateDiagnostic.windowHandlesCount } else { $null }
            windowHandlesErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandlesErrorClass) { [string]$directNavigateDiagnostic.windowHandlesErrorClass } else { $null }
            runType = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.runType) { [string]$directNavigateDiagnostic.runType } else { "timeout_only" }
            postNavigateUrlCheckAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.postNavigateUrlCheckAttempted } else { $false }
            postNavigateUrlFound = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.postNavigateUrlFound } else { $false }
            postNavigateUrlValue = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.postNavigateUrlValue) { [string]$directNavigateDiagnostic.postNavigateUrlValue } else { $null }
            postNavigateUrlErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.postNavigateUrlErrorClass) { [string]$directNavigateDiagnostic.postNavigateUrlErrorClass } else { $null }
            postNavigateUrlErrorMessage = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.postNavigateUrlErrorMessage) { [string]$directNavigateDiagnostic.postNavigateUrlErrorMessage } else { $null }
            currentUrlMatchesTarget = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentUrlMatchesTarget) { [bool]$directNavigateDiagnostic.currentUrlMatchesTarget } else { $null }
            hrefAfterDirectNavigate = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.hrefAfterDirectNavigate } else { "" }
            curlNavigateAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.curlNavigateAttempted } else { $false }
            curlNavigateSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.curlNavigateSucceeded } else { $false }
            curlNavigateExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.curlNavigateExitCode } else { $null }
            curlNavigateStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.curlNavigateStdout } else { "" }
            curlNavigateStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.curlNavigateStderr } else { "" }
            hrefAfterCurlNavigate = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.hrefAfterCurlNavigate } else { "" }
            curlFileNavigateAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.curlFileNavigateAttempted } else { $false }
            curlFileNavigateSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.curlFileNavigateSucceeded } else { $false }
            curlFileNavigateExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.curlFileNavigateExitCode } else { $null }
            curlFileNavigateStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.curlFileNavigateStdout } else { "" }
            curlFileNavigateStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.curlFileNavigateStderr } else { "" }
            hrefAfterCurlFileNavigate = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.hrefAfterCurlFileNavigate } else { "" }
            chromeDriverStatusAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.chromeDriverStatusAttempted } else { $false }
            chromeDriverStatusStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.chromeDriverStatusStdout } else { "" }
            chromeDriverStatusStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.chromeDriverStatusStderr } else { "" }
            chromeDriverStatusExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.chromeDriverStatusExitCode } else { $null }
            sessionsCheckAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.sessionsCheckAttempted } else { $false }
            sessionsCheckStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.sessionsCheckStdout } else { "" }
            sessionsCheckStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.sessionsCheckStderr } else { "" }
            sessionsCheckExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.sessionsCheckExitCode } else { $null }
            checkedSessionId = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.checkedSessionId } else { "" }
            sessionIdFoundInSessions = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.sessionIdFoundInSessions } else { $false }
            sessionsExtractedIds = if ($directNavigateDiagnostic) { @($directNavigateDiagnostic.sessionsExtractedIds) } else { @() }
            sessionsExtractedCount = if ($directNavigateDiagnostic) { [int]$directNavigateDiagnostic.sessionsExtractedCount } else { 0 }
            sessionIdFoundInExtractedIds = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.sessionIdFoundInExtractedIds } else { $false }
            windowCheckAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowCheckAttempted } else { $false }
            windowCheckStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.windowCheckStdout } else { "" }
            windowCheckStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.windowCheckStderr } else { "" }
            windowCheckExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.windowCheckExitCode } else { $null }
            windowHandleFound = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowHandleFound } else { $false }
            windowHandleValue = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandleValue) { [string]$directNavigateDiagnostic.windowHandleValue } else { $null }
            windowHandleErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandleErrorClass) { [string]$directNavigateDiagnostic.windowHandleErrorClass } else { $null }
            windowHandleErrorMessage = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandleErrorMessage) { [string]$directNavigateDiagnostic.windowHandleErrorMessage } else { $null }
            currentUrlCheckAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.currentUrlCheckAttempted } else { $false }
            currentUrlFound = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.currentUrlFound } else { $false }
            currentUrlValue = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentUrlValue) { [string]$directNavigateDiagnostic.currentUrlValue } else { $null }
            currentUrlErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentUrlErrorClass) { [string]$directNavigateDiagnostic.currentUrlErrorClass } else { $null }
            currentUrlErrorMessage = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentUrlErrorMessage) { [string]$directNavigateDiagnostic.currentUrlErrorMessage } else { $null }
            uiInitCheckMethod = "Get-UiInitDiagnostics"
            executeSyncAttempted = $true
            executeSyncErrorMessage = $executeSyncErrorMessage
            executeSyncErrorType = if ($preDiag.error) { "ExecScriptError" } else { "" }
            executeSyncErrorClass = $executeSyncErrorClass
            hrefBeforeUiInit = [string]$preDiag.href
            elementCheckSucceeded = (-not [string]::Equals([string]$preDiag.readyState, "exec-error", [StringComparison]::OrdinalIgnoreCase))
            elementCheckErrorMessage = if ($preDiag.error) { [string]$preDiag.error } else { "" }
            urlBeforeRetry1 = $urlBeforeRetry1
            urlAfterRetry1 = $urlAfterRetry1
            urlBeforeRetry2 = $urlBeforeRetry2
            urlAfterRetry2 = $urlAfterRetry2
            windowBeforeRetry1 = $windowBeforeRetry1
            windowAfterRetry1 = $windowAfterRetry1
            windowBeforeRetry2 = $windowBeforeRetry2
            windowAfterRetry2 = $windowAfterRetry2
            handlesCountBeforeRetry1 = $handlesCountBeforeRetry1
            handlesCountAfterRetry1 = $handlesCountAfterRetry1
            currentHandleBeforeRetry1 = $currentHandleBeforeRetry1
            currentHandleAfterRetry1 = $currentHandleAfterRetry1
            handlesCountBeforeRetry2 = $handlesCountBeforeRetry2
            handlesCountAfterRetry2 = $handlesCountAfterRetry2
            currentHandleBeforeRetry2 = $currentHandleBeforeRetry2
            currentHandleAfterRetry2 = $currentHandleAfterRetry2
            retryInvokeSucceeded1 = $retryInvokeSucceeded1
            retryInvokeSucceeded2 = $retryInvokeSucceeded2
            retryInvokeError1 = $retryInvokeError1
            retryInvokeError2 = $retryInvokeError2
            navigateHttpStatus1 = $navigateHttpStatus1
            navigateResponseBody1 = $navigateResponseBody1
            navigateStderrSummary1 = $navigateStderrSummary1
            webdriverError1 = $webdriverError1
            navigateHttpStatus2 = $navigateHttpStatus2
            navigateResponseBody2 = $navigateResponseBody2
            navigateStderrSummary2 = $navigateStderrSummary2
            webdriverError2 = $webdriverError2
            timestamp = (Get-Date).ToString("o")
          }
          Write-OutputJson @{ preUiInitDiagnostic = $preUiInitDiagnostic } 8
          Write-Host "[stability-test] save pre-ui-init diagnostic to json"
          throw
        }
        Wait-BrowserReady 400
        try { $hrefProbe = [string](Exec-Script "return String(location.href || '');" @() "e2e-only-href-fallback") } catch { $hrefProbe = "" }
        if ($hrefProbe.Contains("wiring-diagram.html")) {
          Write-Host "[stability-test] page fallback open success"
        }
        Write-Host "[stability-test] href after fallback=$hrefProbe"
      }
    }
    Wait-BrowserReady 500
  } else {
    Log-Step "webdriver curl file execute probe" "start"
    $chromeCount = (Get-Process chrome -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "[stability-test] chrome-process-count=$chromeCount"
    Invoke-ExecuteSyncViaCurlFile $script:sessionId "return 1;" | Out-Null
    Log-Step "webdriver curl file execute probe" "done"

    Log-Step "webdriver curl execute probe" "start"
    Invoke-ExecuteSyncViaCurl $script:sessionId "return 1;" | Out-Null
    Log-Step "webdriver curl execute probe" "done"

    Log-Step "webdriver execute probe" "start"
    $wdProbe = Test-WebDriverExecutionLayer
    Log-Step "webdriver execute probe" "done"
    Log-Step "minimal session compare" "start"
    $minimalSessionCompare = Test-MinimalSessionExecute
    Log-Step "minimal session compare" "done"
    Log-Step "capability bisect" "start"
    $capabilityBisect = Test-CapabilityBisect
    Log-Step "capability bisect" "done"
    Log-Step "pageLoadStrategy compare" "start"
    $pageLoadStrategyCompare = Test-PageLoadStrategyCompare
    Log-Step "pageLoadStrategy compare" "done"
    Log-Step "chrome args subtract compare" "start"
    $chromeArgsSubtractCompare = Test-ChromeArgsSubtractCompare
    Log-Step "chrome args subtract compare" "done"
    $currentFirst = if ($wdProbe.results.Count -gt 0) { $wdProbe.results[0] } else { $null }
    $currentExecuteOk = [bool]($currentFirst -and $currentFirst.ok)
    $compareSnapshot = [ordered]@{
      currentExecuteOk = $currentExecuteOk
      currentExecuteError = if ($currentFirst) { $currentFirst.error } else { "" }
      minimalSessionCompare = $minimalSessionCompare
      capabilityCompare = [ordered]@{
        minimal = $minimalSessionCompare.capabilities
        current = $currentCapabilities
      }
      capabilityBisect = $capabilityBisect
      pageLoadStrategyCompare = $pageLoadStrategyCompare
      chromeArgsSubtractCompare = $chromeArgsSubtractCompare
    }
    Write-OutputJson $compareSnapshot 8
    Write-Host "セッション作成レスポンスから capabilities を取得しました"
    Write-Host "テスト結果を保存しました: $outputPath"
    $currentReadyStateProbe = $wdProbe.results | Where-Object { $_.label -eq "ready-state" } | Select-Object -First 1
    $currentReadyState = if ($currentReadyStateProbe -and $currentReadyStateProbe.ok) { [string]$currentReadyStateProbe.value } else { "unknown" }
    $minimalExecuteSummary = if ($minimalSessionCompare.executeSyncOk) { "OK" } else { "NG" }
    $firstTimeoutSummary = if ($capabilityBisect.firstTimeout) { $capabilityBisect.firstTimeout } else { "NONE" }
    $firstErrorSummary = if ($capabilityBisect.firstError) { $capabilityBisect.firstError } else { "NONE" }
    $rootCauseSummary = if ($capabilityBisect.rootCauseCandidate) { $capabilityBisect.rootCauseCandidate } else { "NONE" }
    $resultSummary = "No reproduction in current bisect targets; other capability combinations may be involved."
    if ($firstTimeoutSummary -ne "NONE") {
      $resultSummary = "Likely execute timeout cause: $firstTimeoutSummary"
    } elseif ($firstErrorSummary -ne "NONE") {
      $resultSummary = "Likely execute failure cause: $firstErrorSummary"
    }
    Write-Host "----- 診断結果まとめ -----"
    Write-Host "Minimal session execute: $minimalExecuteSummary"
    Write-Host "Current session readyState: $currentReadyState"
    Write-Host "pageLoadStrategy 比較結果:"
    Write-Host "none: $($pageLoadStrategyCompare.summary.noneResult)"
    Write-Host "eager: $($pageLoadStrategyCompare.summary.eagerResult)"
    Write-Host "Chrome args 比較結果:"
    Write-Host "base: $($chromeArgsSubtractCompare.summary.baseResult)"
    Write-Host "without --headless: $(if ($chromeArgsSubtractCompare.results | Where-Object { $_.label -eq 'without --headless' -and $_.errorType -eq 'SKIP' }) { 'SKIP' } elseif ($chromeArgsSubtractCompare.results | Where-Object { $_.label -eq 'without --headless' -and $_.executeOk }) { 'OK' } else { 'NG' })"
    Write-Host "without --no-sandbox: $(if ($chromeArgsSubtractCompare.results | Where-Object { $_.label -eq 'without --no-sandbox' -and $_.errorType -eq 'SKIP' }) { 'SKIP' } elseif ($chromeArgsSubtractCompare.results | Where-Object { $_.label -eq 'without --no-sandbox' -and $_.executeOk }) { 'OK' } else { 'NG' })"
    Write-Host "最有力原因候補: $rootCauseSummary"
    Write-Host "結論: $resultSummary"
    Write-Host "--------------------------------"
    if ((-not $currentExecuteOk) -and $minimalSessionCompare.executeSyncOk) {
      Write-Host "[stability-test] compare-result current=timeout-or-error minimal=success verdict=current-session-capabilities-likely"
    } elseif ((-not $currentExecuteOk) -and (-not $minimalSessionCompare.executeSyncOk)) {
      Write-Host "[stability-test] compare-result current=timeout-or-error minimal=timeout-or-error verdict=chromedriver-or-browser-behavior-likely"
    } else {
      Write-Host "[stability-test] compare-result current=success minimal=$($minimalSessionCompare.executeSyncStatus)"
    }
  }
  if (-not $wdProbe.ok) {
    $firstFail = $wdProbe.results | Where-Object { -not $_.ok } | Select-Object -First 1
    Read-ChromeDriverVerboseHighlights $script:chromeDriverLogPath
    Write-Host "[stability-test] webdriver execute probe failed at label=$($firstFail.label) error=$($firstFail.error)"
    if ($minimalSessionCompare.executeSyncOk) {
      Write-Host "[stability-test] fallback-to-minimal-session for e2e parse flow assertions"
      try { Remove-Session } catch {}
      $minimalForE2E = New-WebDriverSessionMinimal
      $script:sessionId = $minimalForE2E.sessionId
      Log-SessionCapabilitiesSummary $minimalForE2E.response "minimal-e2e"
      Wait-BrowserReady 700
      if (-not (Open-PageViaCurl $script:sessionId 25)) {
        throw "Minimal session page-open failed."
      }
      $navigated = Wait-Until {
        try {
          [bool](Exec-Script "return location.href.indexOf('wiring-diagram.html') >= 0;")
        } catch {
          $false
        }
      } 15
      if (-not $navigated) {
        Exec-Script "window.location.href = arguments[0]; return true;" @("$($script:baseUrl)/wiring-diagram.html") "minimal-e2e-nav-fallback" | Out-Null
      }
      Wait-BrowserReady 500
    } else {
      throw "WebDriver execute probe failed before ui init."
    }
  }

  Log-Step "wait start(ui init)" "start"
  $uiInit = Wait-UiInitWithDiagnostics 40 800
  $initialized = [bool]$uiInit.ok
  if (-not $initialized) {
    Write-Host "[stability-test] ui init retry after page-open"
    Wait-BrowserReady 700
    try {
      Exec-Script "window.location.href = arguments[0]; return true;" @("$($script:baseUrl)/wiring-diagram.html") "ui-init-retry-nav" | Out-Null
    } catch {
      if (-not (Open-PageViaCurl $script:sessionId 25)) {
        Write-Host "[stability-test] ui init retry navigation failed: $($_.Exception.Message)"
      }
    }
    $uiInit = Wait-UiInitWithDiagnostics 40 800
    $initialized = [bool]$uiInit.ok
  }
  Log-Step "wait start(ui init)" "done"
  if (-not $initialized) {
    if ($skipDiagnosticsForE2E) {
      $preDiag = if ($uiInit -and $uiInit.last) { $uiInit.last } else { Get-UiInitDiagnostics }
      $executeSyncErrorMessage = if ($preDiag.error) { [string]$preDiag.error } else { "" }
      $executeSyncErrorClass = "other"
      $timeoutJa = Make-Japanese @(12479,12452,12512,12450,12454,12488)
      $executeSyncErrorLower = $executeSyncErrorMessage.ToLowerInvariant()
      if (($executeSyncErrorLower -match 'timeout') -or $executeSyncErrorMessage.Contains($timeoutJa)) {
        $executeSyncErrorClass = "timeout"
      } elseif (($executeSyncErrorLower -match 'no such window') -or ($executeSyncErrorLower -match '404')) {
        $executeSyncErrorClass = "no-such-window-or-404"
      }
      $preUiInitDiagnostic = [ordered]@{
        phase = "pre-ui-init-diagnostic"
        href = [string]$preDiag.href
        readyState = [string]$preDiag.readyState
        title = [string]$preDiag.title
        bodyPreview = [string]$preDiag.bodyPreview
        hasProblemTextInput = [bool]$preDiag.hasProblemTextInput
        hasParseProblemButton = [bool]$preDiag.hasParseProblemButton
        hasParseResultPanel = [bool]$preDiag.hasParseResultPanel
        hasParseResultPre = [bool]$preDiag.hasParseResultPre
        navigateTargetUrl = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateTargetUrl } else { "" }
        navigateAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.navigateAttempted } else { $false }
        navigateResponseReceived = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.navigateResponseReceived } else { $false }
        navigateResponseStatusCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.navigateResponseStatusCode } else { $null }
        navigateHttpStatus = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.navigateHttpStatus } else { $null }
        navigateSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.navigateSucceeded } else { $false }
        navigateErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.navigateErrorClass) { [string]$directNavigateDiagnostic.navigateErrorClass } else { $null }
        navigateErrorMessage = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateErrorMessage } else { "" }
        navigateErrorType = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateErrorType } else { "" }
        navigateStatusCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.navigateStatusCode } else { $null }
        navigateResponseBody = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateResponseBody } else { "" }
        navigateStderrSummary = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateStderrSummary } else { "" }
        navigateTransportUsed = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.navigateTransportUsed } else { "" }
        webdriverError = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.webdriverError) { [string]$directNavigateDiagnostic.webdriverError } else { $null }
        executeAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.executeAttempted } else { $false }
        executeSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.executeSucceeded } else { $false }
        executeResult = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.executeResult) { [string]$directNavigateDiagnostic.executeResult } else { $null }
        executeErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.executeErrorClass) { [string]$directNavigateDiagnostic.executeErrorClass } else { $null }
        executeErrorMessage = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.executeErrorMessage) { [string]$directNavigateDiagnostic.executeErrorMessage } else { "" }
        windowProbeAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowProbeAttempted } else { $false }
        currentWindowProbeAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.currentWindowProbeAttempted } else { $false }
        currentWindowHandleSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.currentWindowHandleSucceeded } else { $false }
        currentWindowHandleErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentWindowHandleErrorClass) { [string]$directNavigateDiagnostic.currentWindowHandleErrorClass } else { $null }
        windowHandlesProbeAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowHandlesProbeAttempted } else { $false }
        windowHandlesSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowHandlesSucceeded } else { $false }
        windowHandlesCount = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandlesCount) { [int]$directNavigateDiagnostic.windowHandlesCount } else { $null }
        windowHandlesErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandlesErrorClass) { [string]$directNavigateDiagnostic.windowHandlesErrorClass } else { $null }
        runType = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.runType) { [string]$directNavigateDiagnostic.runType } else { "timeout_only" }
        postNavigateUrlCheckAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.postNavigateUrlCheckAttempted } else { $false }
        postNavigateUrlFound = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.postNavigateUrlFound } else { $false }
        postNavigateUrlValue = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.postNavigateUrlValue) { [string]$directNavigateDiagnostic.postNavigateUrlValue } else { $null }
        postNavigateUrlErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.postNavigateUrlErrorClass) { [string]$directNavigateDiagnostic.postNavigateUrlErrorClass } else { $null }
        postNavigateUrlErrorMessage = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.postNavigateUrlErrorMessage) { [string]$directNavigateDiagnostic.postNavigateUrlErrorMessage } else { $null }
        currentUrlMatchesTarget = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentUrlMatchesTarget) { [bool]$directNavigateDiagnostic.currentUrlMatchesTarget } else { $null }
        hrefAfterDirectNavigate = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.hrefAfterDirectNavigate } else { "" }
        curlNavigateAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.curlNavigateAttempted } else { $false }
        curlNavigateSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.curlNavigateSucceeded } else { $false }
        curlNavigateExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.curlNavigateExitCode } else { $null }
        curlNavigateStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.curlNavigateStdout } else { "" }
        curlNavigateStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.curlNavigateStderr } else { "" }
        hrefAfterCurlNavigate = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.hrefAfterCurlNavigate } else { "" }
        curlFileNavigateAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.curlFileNavigateAttempted } else { $false }
        curlFileNavigateSucceeded = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.curlFileNavigateSucceeded } else { $false }
        curlFileNavigateExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.curlFileNavigateExitCode } else { $null }
        curlFileNavigateStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.curlFileNavigateStdout } else { "" }
        curlFileNavigateStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.curlFileNavigateStderr } else { "" }
        hrefAfterCurlFileNavigate = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.hrefAfterCurlFileNavigate } else { "" }
        chromeDriverStatusAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.chromeDriverStatusAttempted } else { $false }
        chromeDriverStatusStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.chromeDriverStatusStdout } else { "" }
        chromeDriverStatusStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.chromeDriverStatusStderr } else { "" }
        chromeDriverStatusExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.chromeDriverStatusExitCode } else { $null }
        sessionsCheckAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.sessionsCheckAttempted } else { $false }
        sessionsCheckStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.sessionsCheckStdout } else { "" }
        sessionsCheckStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.sessionsCheckStderr } else { "" }
        sessionsCheckExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.sessionsCheckExitCode } else { $null }
        checkedSessionId = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.checkedSessionId } else { "" }
        sessionIdFoundInSessions = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.sessionIdFoundInSessions } else { $false }
        sessionsExtractedIds = if ($directNavigateDiagnostic) { @($directNavigateDiagnostic.sessionsExtractedIds) } else { @() }
        sessionsExtractedCount = if ($directNavigateDiagnostic) { [int]$directNavigateDiagnostic.sessionsExtractedCount } else { 0 }
        sessionIdFoundInExtractedIds = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.sessionIdFoundInExtractedIds } else { $false }
        windowCheckAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowCheckAttempted } else { $false }
        windowCheckStdout = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.windowCheckStdout } else { "" }
        windowCheckStderr = if ($directNavigateDiagnostic) { [string]$directNavigateDiagnostic.windowCheckStderr } else { "" }
        windowCheckExitCode = if ($directNavigateDiagnostic) { $directNavigateDiagnostic.windowCheckExitCode } else { $null }
        windowHandleFound = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.windowHandleFound } else { $false }
        windowHandleValue = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandleValue) { [string]$directNavigateDiagnostic.windowHandleValue } else { $null }
        windowHandleErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandleErrorClass) { [string]$directNavigateDiagnostic.windowHandleErrorClass } else { $null }
        windowHandleErrorMessage = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.windowHandleErrorMessage) { [string]$directNavigateDiagnostic.windowHandleErrorMessage } else { $null }
        currentUrlCheckAttempted = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.currentUrlCheckAttempted } else { $false }
        currentUrlFound = if ($directNavigateDiagnostic) { [bool]$directNavigateDiagnostic.currentUrlFound } else { $false }
        currentUrlValue = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentUrlValue) { [string]$directNavigateDiagnostic.currentUrlValue } else { $null }
        currentUrlErrorClass = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentUrlErrorClass) { [string]$directNavigateDiagnostic.currentUrlErrorClass } else { $null }
        currentUrlErrorMessage = if ($directNavigateDiagnostic -and $null -ne $directNavigateDiagnostic.currentUrlErrorMessage) { [string]$directNavigateDiagnostic.currentUrlErrorMessage } else { $null }
        uiInitCheckMethod = "Get-UiInitDiagnostics"
        executeSyncAttempted = $true
        executeSyncErrorMessage = $executeSyncErrorMessage
        executeSyncErrorType = if ($preDiag.error) { "ExecScriptError" } else { "" }
        executeSyncErrorClass = $executeSyncErrorClass
        hrefBeforeUiInit = [string]$preDiag.href
        elementCheckSucceeded = (-not [string]::Equals([string]$preDiag.readyState, "exec-error", [StringComparison]::OrdinalIgnoreCase))
        elementCheckErrorMessage = if ($preDiag.error) { [string]$preDiag.error } else { "" }
        urlBeforeRetry1 = $urlBeforeRetry1
        urlAfterRetry1 = $urlAfterRetry1
        urlBeforeRetry2 = $urlBeforeRetry2
        urlAfterRetry2 = $urlAfterRetry2
        windowBeforeRetry1 = $windowBeforeRetry1
        windowAfterRetry1 = $windowAfterRetry1
        windowBeforeRetry2 = $windowBeforeRetry2
        windowAfterRetry2 = $windowAfterRetry2
        handlesCountBeforeRetry1 = $handlesCountBeforeRetry1
        handlesCountAfterRetry1 = $handlesCountAfterRetry1
        currentHandleBeforeRetry1 = $currentHandleBeforeRetry1
        currentHandleAfterRetry1 = $currentHandleAfterRetry1
        handlesCountBeforeRetry2 = $handlesCountBeforeRetry2
        handlesCountAfterRetry2 = $handlesCountAfterRetry2
        currentHandleBeforeRetry2 = $currentHandleBeforeRetry2
        currentHandleAfterRetry2 = $currentHandleAfterRetry2
        retryInvokeSucceeded1 = $retryInvokeSucceeded1
        retryInvokeSucceeded2 = $retryInvokeSucceeded2
        retryInvokeError1 = $retryInvokeError1
        retryInvokeError2 = $retryInvokeError2
        navigateHttpStatus1 = $navigateHttpStatus1
        navigateResponseBody1 = $navigateResponseBody1
        navigateStderrSummary1 = $navigateStderrSummary1
        webdriverError1 = $webdriverError1
        navigateHttpStatus2 = $navigateHttpStatus2
        navigateResponseBody2 = $navigateResponseBody2
        navigateStderrSummary2 = $navigateStderrSummary2
        webdriverError2 = $webdriverError2
        timestamp = (Get-Date).ToString("o")
      }
      Write-OutputJson @{ preUiInitDiagnostic = $preUiInitDiagnostic } 8
      Write-Host "[stability-test] save pre-ui-init diagnostic to json"
    }
    throw "UI init timeout."
  }

  $successInput = (Make-Japanese @(29255,20999,49,28783))
  $failureInput = "###"

  Log-Step "e2e case success parse" "start"
  $successClickOk = Invoke-ParseClick $successInput
  $successParseReady = if ($successClickOk) { [bool](Wait-ParseResultUpdated 20) } else { $false }
  $successBefore = Get-E2EUiSnapshot
  Start-Sleep -Milliseconds 900
  $successAfter = Get-E2EUiSnapshot
  $successBeforeChecks = Get-SuccessUiChecks $successBefore
  $successAfterChecks = Get-SuccessUiChecks $successAfter
  $successRequiredKeys = @("circuit_list_non_empty", "material_not_empty", "material_not_material_none", "wire_length_has_label", "ai_not_fallback")
  $successBeforePass = Get-ChecksPass $successBeforeChecks $successRequiredKeys
  $successAfterPass = Get-ChecksPass $successAfterChecks $successRequiredKeys
  Log-Step "e2e case success parse" "done"

  Log-Step "e2e case failure parse" "start"
  $failureClickOk = Invoke-ParseClick $failureInput
  $failureParseReady = if ($failureClickOk) { [bool](Wait-ParseResultUpdated 20) } else { $false }
  $failureBefore = Get-E2EUiSnapshot
  Start-Sleep -Milliseconds 900
  $failureAfter = Get-E2EUiSnapshot
  $failureBeforeChecks = Get-FailureUiChecks $failureBefore
  $failureAfterChecks = Get-FailureUiChecks $failureAfter
  $failureRequiredKeys = @("circuit_list_empty", "material_is_material_none", "wire_length_has_label", "wire_length_is_zero", "ai_has_fallback_title", "ai_has_fallback_desc")
  $failureBeforePass = Get-ChecksPass $failureBeforeChecks $failureRequiredKeys
  $failureAfterPass = Get-ChecksPass $failureAfterChecks $failureRequiredKeys
  Log-Step "e2e case failure parse" "done"

  Log-Step "downstream contract cases" "start"
  $downstreamCaseMatrix = @(
    [ordered]@{
      name = "single_1light"
      input = (Make-Japanese @(29255,20999,49,28783))
      expected = [ordered]@{
        requiredRoles = @("line", "neutral", "switch_return")
        expectedEdgeCount = 3
        requireTraveler = $false
      }
    },
    [ordered]@{
      name = "light_plus_outlet"
      input = (Make-Japanese @(29255,20999,49,28783,32,12467,12531,12475,12531,12488,49,20491))
      expected = [ordered]@{
        requiredRoles = @("line", "line_load", "neutral", "switch_return")
        expectedEdgeCount = 5
        requireTraveler = $false
      }
    },
    [ordered]@{
      name = "threeway_1light"
      input = (Make-Japanese @(51,36335,49,28783))
      expected = [ordered]@{
        requiredRoles = @("line", "neutral", "switch_return", "traveler_1", "traveler_2")
        expectedEdgeCount = 5
        requireTraveler = $true
      }
    },
    [ordered]@{
      name = "threeway_2light"
      input = (Make-Japanese @(51,36335,50,28783))
      expected = [ordered]@{
        requiredRoles = @("line", "neutral", "switch_return", "traveler_1", "traveler_2")
        expectedEdgeCount = 7
        requireTraveler = $true
      }
    },
    [ordered]@{
      name = "threeway_2light_plus_outlet"
      input = (Make-Japanese @(51,36335,50,28783,32,12467,12531,12475,12531,12488,49,20491))
      expected = [ordered]@{
        requiredRoles = @("line", "line_load", "neutral", "switch_return", "traveler_1", "traveler_2")
        expectedEdgeCount = 9
        requireTraveler = $true
      }
    },
    [ordered]@{
      name = "threeway_2light_plus_2outlets"
      input = (Make-Japanese @(51,36335,50,28783,32,12467,12531,12475,12531,12488,50,20491))
      expected = [ordered]@{
        requiredRoles = @("line", "line_load", "neutral", "switch_return", "traveler_1", "traveler_2")
        expectedEdgeCount = 11
        requireTraveler = $true
      }
    }
  )
  $downstreamChecks = @()
  foreach ($caseDef in $downstreamCaseMatrix) {
    $downstreamChecks += Test-DownstreamContractCase $caseDef.name $caseDef.input $caseDef.expected
  }
  $downstreamAllPass = (-not (@($downstreamChecks | Where-Object { $_.status -ne "OK" }).Count))
  Log-Step "downstream contract cases" "done"

  $result = [ordered]@{
    success_before_wait = [ordered]@{
      parseReady = $successParseReady
      checks = $successBeforeChecks
      requiredPass = $successBeforePass
      snapshot = $successBefore
    }
    success_after_wait = [ordered]@{
      parseReady = $successParseReady
      checks = $successAfterChecks
      requiredPass = $successAfterPass
      snapshot = $successAfter
    }
    failure_before_wait = [ordered]@{
      parseReady = $failureParseReady
      checks = $failureBeforeChecks
      requiredPass = $failureBeforePass
      snapshot = $failureBefore
    }
    failure_after_wait = [ordered]@{
      parseReady = $failureParseReady
      checks = $failureAfterChecks
      requiredPass = $failureAfterPass
      snapshot = $failureAfter
    }
    downstream_contract = [ordered]@{
      all_pass = [bool]$downstreamAllPass
      cases = $downstreamChecks
    }
    assertions = [ordered]@{
      success_case_pass = ([bool]$successParseReady -and [bool]$successBeforePass)
      failure_case_pass = ([bool]$failureParseReady -and [bool]$failureBeforePass)
      success_state_stable_after_wait = ([bool]$successBeforePass -and [bool]$successAfterPass)
      failure_state_stable_after_wait = ([bool]$failureBeforePass -and [bool]$failureAfterPass)
      downstream_contract_pass = [bool]$downstreamAllPass
      overall_pass = ([bool]$successParseReady -and [bool]$successBeforePass -and [bool]$failureParseReady -and [bool]$failureBeforePass -and [bool]$successAfterPass -and [bool]$failureAfterPass -and [bool]$downstreamAllPass)
    }
  }

  Write-OutputJson $result 10 $true
  Write-Host "Saved E2E results to $outputPath"
  Write-Host ("[E2E] success(before)={0} success(after)={1}" -f $(if ($successBeforePass) { "PASS" } else { "FAIL" }), $(if ($successAfterPass) { "PASS" } else { "FAIL" }))
  Write-Host ("[E2E] failure(before)={0} failure(after)={1}" -f $(if ($failureBeforePass) { "PASS" } else { "FAIL" }), $(if ($failureAfterPass) { "PASS" } else { "FAIL" }))
  Write-Host ("[E2E] downstream-contract={0}" -f $(if ($downstreamAllPass) { "PASS" } else { "FAIL" }))
  Write-Host ("[E2E] overall={0}" -f $(if ($result.assertions.overall_pass) { "PASS" } else { "FAIL" }))
}
finally {
  Log-Step "finally cleanup" "start"
  Remove-Session
  Stop-Driver
  Stop-StaticServer
  if ($script:curlProbeBodyPath) {
    try { Remove-Item $script:curlProbeBodyPath -Force -ErrorAction SilentlyContinue } catch {}
  }
  Read-ChromeDriverVerboseHighlights $script:chromeDriverLogPath
  Log-Step "finally cleanup" "done"
}
