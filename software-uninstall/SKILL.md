---
name: software-uninstall
description: Clean uninstall Windows software using multiple methods - Control Panel, Settings, PowerShell Get-Package, Geek Uninstaller, and manual registry cleanup. Use when user wants to uninstall software or remove programs completely.
version: 1.0.0
author: fangjin
license: MIT
metadata:
  tags: [windows, uninstall, software, cleanup, registry, powershell]
  triggers:
    - "uninstall software"
    - "remove program"
    - "卸载软件"
    - "卸载程序"
    - "clean uninstall"
    - "完全卸载"
---

# Software Uninstall Skill

Completely uninstall Windows software using multiple methods to ensure clean removal.

## Purpose

Provide a thorough software uninstallation workflow that:
1. Tries standard uninstallation methods first
2. Falls back to alternative methods if standard fails
3. Cleans up残留 files and registry entries
4. Verifies complete removal

## Activation Signals

Use this skill when:
- User says "uninstall software" or "remove program"
- User mentions "卸载软件" or "卸载程序"
- Need to completely remove a Windows application
- Standard uninstallation failed or left残留

## Inputs

| Parameter | Required | Description |
|-----------|----------|-------------|
| `software_name` | Yes | Name of the software to uninstall (partial names accepted) |
| `method` | No | Preferred method: auto, control-panel, settings, powershell, geek, manual |

## Preconditions

1. Windows operating system
2. Administrator privileges (for some methods)
3. For "geek" method: Geek Uninstaller installed

## Methods Overview

| Method | Best For | Speed | Completeness |
|--------|----------|-------|--------------|
| Control Panel | Traditional Win32 apps | Medium | Medium |
| Settings | Modern UWP/Store apps | Fast | Medium |
| PowerShell | Scripted/automated | Fast | Medium |
| Geek Uninstaller | Deep cleaning | Medium | High |
| Manual | Stubborn software | Slow | High |

## Step-by-Step Procedure

### Method 1: Settings App (Windows 10/11)

**Best for**: Modern apps, UWP apps

```powershell
# List installed apps
Get-AppxPackage | Select-Object Name, PackageFullName | Sort-Object Name

# Find specific app
Get-AppxPackage | Where-Object {$_.Name -like "*<software_name>*"}

# Remove app (for current user)
Get-AppxPackage | Where-Object {$_.Name -like "*<software_name>*"} | Remove-AppxPackage

# Remove app (for all users) - requires admin
Get-AppxPackage -AllUsers | Where-Object {$_.Name -like "*<software_name>*"} | Remove-AppxPackage -AllUsers
```

**Decision rule**: If app not found here, try other methods.

### Method 2: Control Panel

**Best for**: Traditional desktop applications

```powershell
# List installed programs
Get-WmiObject -Class Win32_Product | Select-Object Name, Version, IdentifyingNumber | Sort-Object Name

# Alternative: Get-Package (PowerShell 5+)
Get-Package | Where-Object {$_.Name -like "*<software_name>*"}

# Uninstall via Control Panel (opens GUI)
appwiz.cpl
```

**Manual steps**: 
1. Run `appwiz.cpl`
2. Find software in list
3. Right-click → Uninstall
4. Follow uninstaller wizard

### Method 3: PowerShell Get-Package

**Best for**: Automated/scripted uninstallation

```powershell
# Find package
$package = Get-Package | Where-Object {$_.Name -like "*<software_name>*"}

# Uninstall
$package | Uninstall-Package -Force

# Or by name directly
Get-Package -Name "*<software_name>*" | Uninstall-Package -Force
```

**Decision rule**: Check if provider is `Programs` or `msi`. MSI packages may need different handling.

### Method 4: Geek Uninstaller (Recommended for Deep Clean)

**Best for**: Complete removal including残留 files

```powershell
# Check if Geek is installed
Test-Path "$env:ProgramFiles\Geek Uninstaller\geek.exe"
Test-Path "$env:LOCALAPPDATA\Geek Uninstaller\geek.exe"

# Launch Geek with search
# Manual: Search for software, right-click, select "Force Removal"
```

**Geek Uninstaller modes**:
- **Regular uninstall**: Standard uninstallation
- **Force removal**: Removes without running uninstaller
- **Deep scan**: Finds and removes残留 files/registry after uninstall

### Method 5: Manual Registry Cleanup

**Best for**: Stubborn software, broken uninstallers

```powershell
# Search registry for software keys
Get-ChildItem -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall" | 
    Get-ItemProperty | Where-Object {$_.DisplayName -like "*<software_name>*"}

Get-ChildItem -Path "HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall" | 
    Get-ItemProperty | Where-Object {$_.DisplayName -like "*<software_name>*"}

# Get uninstall string
$regPath = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\{GUID}"
(Get-ItemProperty $regPath).UninstallString

# Run uninstaller directly
& "C:\Program Files\Software\uninstall.exe" /S
```

### Method 6: Cleanup残留 Files

```powershell
# Common locations to check
$paths = @(
    "$env:PROGRAMFILES\<SoftwareName>"
    "$env:PROGRAMFILES(x86)\<SoftwareName>"
    "$env:LOCALAPPDATA\<SoftwareName>"
    "$env:APPDATA\<SoftwareName>"
    "$env:PUBLIC\AppData\Local\<SoftwareName>"
)

# Check and remove
foreach ($path in $paths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force
        Write-Host "Removed: $path"
    }
}
```

## Complete Workflow (Recommended)

```powershell
# Step 1: Identify software
$software = "<software_name>"
$apps = Get-Package | Where-Object {$_.Name -like "*$software*"}
$appx = Get-AppxPackage | Where-Object {$_.Name -like "*$software*"}

# Step 2: Try Settings/Package method first
if ($appx) {
    $appx | Remove-AppxPackage
}

# Step 3: Try Get-Package uninstall
if ($apps) {
    $apps | Uninstall-Package -Force
}

# Step 4: If still present, try Geek Uninstaller
# (Manual step - launch geek.exe)

# Step 5: Cleanup残留
# Run cleanup script above

# Step 6: Verify removal
$remaining = Get-Package | Where-Object {$_.Name -like "*$software*"}
$remainingAppx = Get-AppxPackage | Where-Object {$_.Name -like "*$software*"}

if (-not $remaining -and -not $remainingAppx) {
    Write-Host "✓ Uninstallation successful"
} else {
    Write-Host "✗ Software may still be present"
}
```

## Output Contract

On success:
```json
{
  "success": true,
  "software": "<name>",
  "methods_used": ["Get-Package", "File cleanup"],
  "files_removed": ["C:\\Program Files\\Software", "..."],
  "registry_cleaned": true
}
```

On failure:
```json
{
  "success": false,
  "software": "<name>",
  "error": "Could not complete uninstallation",
  "remaining_files": ["..."],
  "suggestion": "Try Geek Uninstaller or manual registry cleanup"
}
```

## Failure Modes

| Failure | Cause | Recovery |
|---------|-------|----------|
| Access denied | Insufficient privileges | Run as Administrator |
| Uninstaller not found | Broken installation | Use Geek or manual removal |
| File in use | Software running | Kill processes first, then retry |
| Registry locked | Protected keys | Use Geek Uninstaller |
| Partial uninstall | Incomplete uninstaller | Manual cleanup required |

## Common Software Patterns

| Software Type | Best Method | Notes |
|--------------|-------------|-------|
| Microsoft Store apps | Get-AppxPackage | Modern apps |
| MSI installers | Get-Package | Standard Windows installers |
| Portable apps | Manual file deletion | No registry entries |
| Adobe products | Geek Uninstaller | Often leaves残留 |
| Antivirus | Official uninstaller tool | May need special handling |

## Examples

### Example 1: Uninstall a Store app

```powershell
# User: "卸载 Teams"
Get-AppxPackage | Where-Object {$_.Name -like "*Teams*"}
Get-AppxPackage | Where-Object {$_.Name -like "*Teams*"} | Remove-AppxPackage
```

### Example 2: Deep clean a desktop app

```powershell
# User: "完全卸载某个软件"
$name = "SoftwareName"

# 1. Try standard uninstall
Get-Package | Where-Object {$_.Name -like "*$name*"} | Uninstall-Package -Force

# 2. Clean残留 files
Remove-Item -Path "$env:PROGRAMFILES\$name" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\$name" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Verify
Get-Package | Where-Object {$_.Name -like "*$name*"}
```

### Example 3: Force remove stubborn software

```powershell
# User: "软件卸载不了怎么办"
# Launch Geek Uninstaller for manual deep removal
& "$env:ProgramFiles\Geek Uninstaller\geek.exe"
# Then search and select "Force Removal" + "Deep Scan"
```

## Checklist

- [ ] Software identified correctly
- [ ] Tried Get-Package or Get-AppxPackage first
- [ ] Ran uninstaller with appropriate privileges
- [ ] Checked for残留 in Program Files
- [ ] Checked for残留 in AppData/Local
- [ ] Cleaned registry if necessary (Geek/manual)
- [ ] Verified complete removal
- [ ] Reboot recommended if drivers/services involved

## References

- Geek Uninstaller: https://geekuninstaller.com/
- PowerShell Get-Package: https://docs.microsoft.com/powershell/module/packageManagement/Get-Package
- Win32_Product: https://docs.microsoft.com/windows/win32/cimwin32prov/win32-product
