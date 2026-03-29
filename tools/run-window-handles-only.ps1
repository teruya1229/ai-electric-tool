function Get-Tail($path) {
    try {
        if (Test-Path $path -PathType Leaf) {
            $lines = Get-Content $path -ErrorAction SilentlyContinue
            if ($lines) { return (($lines | Select-Object -Last 5) -join " | ") }
        }
    } catch {}
    return "(empty)"
}

function Run-WindowHandlesChild([bool]$withProbe) {
    $projectRoot = Split-Path $PSScriptRoot -Parent
    $stabilityScript = Join-Path $projectRoot "stability-test.ps1"
    $casePath = Join-Path $projectRoot ".tmp_case_results.json"

    if ($withProbe) {
        $stdoutPath = Join-Path $projectRoot ".tmp_with_stdout.txt"
        $stderrPath = Join-Path $projectRoot ".tmp_with_stderr.txt"
    } else {
        $stdoutPath = Join-Path $projectRoot ".tmp_without_stdout.txt"
        $stderrPath = Join-Path $projectRoot ".tmp_without_stderr.txt"
    }

    foreach ($name in @(
        'STABILITY_REPEAT_CHILD',
        'STABILITY_COMPARE_CHILD',
        'STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE',
        'STABILITY_COMPARE_WINDOW_HANDLES_MODES',
        'STABILITY_COMPARE_NAV_MODES',
        'STABILITY_COMPARE_EXECUTE_MODES',
        'STABILITY_COMPARE_WINDOW_MODES',
        'STABILITY_COMPARE_CURRENT_WINDOW_MODES',
        'STABILITY_COMPARE_WINDOW_HANDLES_TIMING_MODES',
        'STABILITY_COMPARE_WITH_EXECUTE',
        'STABILITY_COMPARE_WITH_WINDOW_PROBE',
        'STABILITY_COMPARE_WITH_CURRENT_WINDOW_PROBE'
    )) {
        Remove-Item -Path "Env:$name" -ErrorAction SilentlyContinue
    }

    try { Remove-Item $casePath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $stdoutPath -Force -ErrorAction SilentlyContinue } catch {}
    try { Remove-Item $stderrPath -Force -ErrorAction SilentlyContinue } catch {}

    $env:STABILITY_REPEAT_CHILD = "1"
    $env:STABILITY_COMPARE_CHILD = "1"
    if ($withProbe) {
        $env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE = "1"
    }

    $p = $null
    $finished = $false

    try {
        $p = Start-Process -FilePath "powershell" `
            -ArgumentList "-ExecutionPolicy","Bypass","-File",$stabilityScript `
            -PassThru `
            -RedirectStandardOutput $stdoutPath `
            -RedirectStandardError $stderrPath

        $finished = $p.WaitForExit(90000)
        if (-not $finished) {
            try { $p.Kill() } catch {}
        }
    } catch {}

    Remove-Item Env:STABILITY_REPEAT_CHILD -ErrorAction SilentlyContinue
    Remove-Item Env:STABILITY_COMPARE_CHILD -ErrorAction SilentlyContinue
    Remove-Item Env:STABILITY_COMPARE_WITH_WINDOW_HANDLES_PROBE -ErrorAction SilentlyContinue

    $json = $null
    if (Test-Path $casePath -PathType Leaf) {
        try { $json = Get-Content -Raw $casePath | ConvertFrom-Json } catch {}
    }

    $diag = $null
    if ($null -ne $json) {
        if ($json.PSObject.Properties.Name -contains "preUiInitDiagnostic") {
            $diag = $json.preUiInitDiagnostic
        } elseif ($json.PSObject.Properties.Name -contains "diagnostic") {
            $diag = $json.diagnostic
        }
    }

    [ordered]@{
        withProbe = $withProbe
        timedOut = (-not $finished)
        exitCode = if ($finished -and $null -ne $p) { $p.ExitCode } else { $null }
        caseFileExists = (Test-Path $casePath -PathType Leaf)
        stdoutTail = (Get-Tail $stdoutPath)
        stderrTail = (Get-Tail $stderrPath)
        topLevelKeys = if ($null -ne $json) { (($json.PSObject.Properties.Name) -join ", ") } else { "" }
        hasDiagnostic = ($null -ne $diag)
        runType = if ($null -ne $diag) { [string]$diag.runType } else { "" }
        hrefBeforeUiInit = if ($null -ne $diag) { [string]$diag.hrefBeforeUiInit } else { "" }
        windowHandlesSucceeded = if ($null -ne $diag) { [string]$diag.windowHandlesSucceeded } else { "" }
        windowHandlesCount = if ($null -ne $diag) { [string]$diag.windowHandlesCount } else { "" }
        windowHandlesErrorClass = if ($null -ne $diag) { [string]$diag.windowHandlesErrorClass } else { "" }
        compareWithWindowHandlesProbe = if ($null -ne $diag) { [string]$diag.compareWithWindowHandlesProbe } else { "" }
    }
}

$with = Run-WindowHandlesChild $true
$without = Run-WindowHandlesChild $false

Write-Host "[window-handles-probe]"
Write-Host "probeScriptRev: DIRECT_WITHOUT_COMPARE_FIXED"
Write-Host ""
Write-Host "-- WITH PROBE --"
$with.GetEnumerator() | ForEach-Object { Write-Host "$($_.Key): $($_.Value)" }
Write-Host ""
Write-Host "-- WITHOUT PROBE --"
$without.GetEnumerator() | ForEach-Object { Write-Host "$($_.Key): $($_.Value)" }