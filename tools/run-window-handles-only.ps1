try {
    $varsToClear = @(
        'STABILITY_COMPARE_NAV_MODES'
        'STABILITY_COMPARE_EXECUTE_MODES'
        'STABILITY_COMPARE_WINDOW_MODES'
        'STABILITY_COMPARE_CURRENT_WINDOW_MODES'
        'STABILITY_COMPARE_WINDOW_HANDLES_TIMING_MODES'
        'STABILITY_COMPARE_WITH_EXECUTE'
        'STABILITY_COMPARE_WITH_WINDOW_PROBE'
        'STABILITY_COMPARE_WITH_CURRENT_WINDOW_PROBE'
    )

    foreach ($name in $varsToClear) {
        Remove-Item -Path "Env:$name" -ErrorAction SilentlyContinue
    }

    $env:STABILITY_COMPARE_WINDOW_HANDLES_MODES = '1'
    powershell -ExecutionPolicy Bypass -File ".\stability-test.ps1"
    exit $LASTEXITCODE
}
catch {
    Write-Error "[ERROR] run-window-handles-only failed: $($_.Exception.Message)"
    exit 1
}
