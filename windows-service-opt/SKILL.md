---
name: windows-service-opt
description: Windows service management and optimization - view, start, stop, configure services. Use when managing Windows services, optimizing startup, or troubleshooting service issues.
version: 1.0.0
author: fangjin
license: MIT
metadata:
  tags: [windows, service, optimization, system, performance, startup]
  triggers:
    - "optimize windows"
    - "windows service"
    - "禁用服务"
    - "启动优化"
    - "service management"
    - "system optimization"
---

# Windows Service Optimization Skill

Manage and optimize Windows services for better performance and startup time.

## Purpose

Enable efficient Windows service management:
1. View running and installed services
2. Identify unnecessary services
3. Configure startup types
4. Start/stop services safely
5. Optimize system performance

## Activation Signals

Use this skill when:
- User says "optimize windows" or "windows service"
- Managing Windows services
- Troubleshooting service issues
- Optimizing system startup
- Configuring service startup types

## Inputs

| Parameter | Required | Description |
|-----------|----------|-------------|
| `action` | Yes | Action: list, start, stop, disable, enable, config |
| `service_name` | Conditional | Service name or display name (required for start/stop/config) |
| `startup_type` | Conditional | Startup type: auto, manual, disabled (required for config) |

## Preconditions

1. Windows operating system
2. Administrator privileges (for most operations)
3. Understanding of service dependencies

## Common Services Reference

| Service | Default | Can Disable? | Impact |
|---------|---------|--------------|--------|
| SysMain (Superfetch) | Auto | Yes | May slow down app launch |
| Windows Search | Auto | Yes | Search will be slower |
| Print Spooler | Auto | If no printer | Can't print |
| Fax | Manual | Yes | No impact if no fax |
| Windows Update | Auto | Not recommended | Security risk |
| Bluetooth Support | Auto | If no BT | No Bluetooth |
| Xbox Live | Manual | If no gaming | No Xbox features |
| OneSync | Auto | Yes | No mail/calendar sync |

## Step-by-Step Procedure

### Step 1: List Services

```powershell
# All services
Get-Service | Select-Object Name, DisplayName, Status, StartType | 
    Sort-Object Status -Descending | Format-Table -AutoSize

# Running services only
Get-Service | Where-Object {$_.Status -eq 'Running'} | 
    Select-Object Name, DisplayName, StartType

# Specific service
Get-Service -Name "SysMain"
Get-Service -DisplayName "*Search*"

# Detailed info
Get-Service -Name "SysMain" | Select-Object *
```

### Step 2: Check Service Dependencies

```powershell
# View dependencies
Get-Service -Name "ServiceName" -RequiredServices
Get-Service -Name "ServiceName" -DependentServices

# Full dependency tree
$svc = Get-Service -Name "ServiceName"
$svc.ServicesDependedOn
$svc.DependentServices
```

**Decision rule**: Don't disable if other critical services depend on it.

### Step 3: Configure Startup Type

```powershell
# Set startup type
Set-Service -Name "ServiceName" -StartupType Disabled
Set-Service -Name "ServiceName" -StartupType Manual
Set-Service -Name "ServiceName" -StartupType Automatic

# Verify
Get-Service -Name "ServiceName" | Select-Object Name, StartType
```

**Startup Types**:
- **Automatic**: Starts at boot
- **Manual**: Starts when needed
- **Disabled**: Cannot start

### Step 4: Start/Stop Services

```powershell
# Stop service
Stop-Service -Name "ServiceName" -Force

# Start service
Start-Service -Name "ServiceName"

# Restart service
Restart-Service -Name "ServiceName" -Force

# Check status
Get-Service -Name "ServiceName"
```

### Step 5: Identify Optimization Candidates

```powershell
# Services set to Auto but not running (may be unnecessary)
Get-Service | Where-Object {$_.StartType -eq 'Automatic' -and $_.Status -eq 'Stopped'}

# Non-Microsoft services
Get-Service | Where-Object {$_.ServiceType -eq 'Win32OwnProcess'}

# Services with high impact (check Task Manager for resource usage)
```

### Step 6: Safe Optimization Script

```powershell
# Common safe-to-disable services (check your needs first!)
$safeToDisable = @(
    "Fax",
    "WMPNetworkSvc",  # Windows Media Player
    "XblAuthManager", # Xbox
    "XblGameSave",
    "XboxNetApiSvc",
    "DiagTrack",      # Diagnostics (privacy)
    "dmwappushservice", # WAP Push
    "MapsBroker",     # Maps
    "lfsvc"           # Geolocation
)

foreach ($svc in $safeToDisable) {
    $service = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "Disabling: $($service.DisplayName)"
        Set-Service -Name $svc -StartupType Disabled
        Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
    }
}
```

**Warning**: Research each service before disabling. System needs vary.

## Service Configuration Examples

### Disable SysMain (Superfetch)

```powershell
# Check current status
Get-Service -Name "SysMain"

# Stop and disable
Stop-Service -Name "SysMain" -Force
Set-Service -Name "SysMain" -StartupType Disabled

# Verify
Get-Service -Name "SysMain" | Select-Object Name, Status, StartType
```

**When to disable**: On SSD systems with plenty of RAM, benefit is minimal.

### Disable Windows Search

```powershell
# Stop and disable
Stop-Service -Name "WSearch" -Force
Set-Service -Name "WSearch" -StartupType Disabled

# Re-enable if needed
Set-Service -Name "WSearch" -StartupType Automatic
Start-Service -Name "WSearch"
```

**When to disable**: If you rarely use Windows search indexing.

### Optimize Print Spooler

```powershell
# If no printer attached
Stop-Service -Name "Spooler" -Force
Set-Service -Name "Spooler" -StartupType Disabled

# To re-enable for printing
Set-Service -Name "Spooler" -StartupType Automatic
Start-Service -Name "Spooler"
```

## Output Contract

After configuration:
```json
{
  "action": "optimize",
  "services_modified": [
    {
      "name": "SysMain",
      "old_startup": "Automatic",
      "new_startup": "Disabled",
      "status": "Stopped"
    }
  ],
  "recommendations": [
    "Reboot to apply all changes",
    "Monitor system for any issues"
  ]
}
```

## Failure Modes

| Failure | Cause | Recovery |
|---------|-------|----------|
| Access denied | Not running as admin | Run PowerShell as Administrator |
| Service won't stop | Hung process | Use `-Force` or Task Manager |
| Dependencies | Other services need it | Check dependencies first |
| System instability | Disabled critical service | Boot to safe mode, re-enable |

## Safety Guidelines

### DO
- Research services before disabling
- Check dependencies
- Create restore point before bulk changes
- Test one change at a time
- Keep list of what you changed

### DON'T
- Disable Windows Update
- Disable Windows Defender (security risk)
- Disable services you don't understand
- Bulk disable without checking
- Forget to create restore point

## Decision Rules

- **SSD + 16GB+ RAM**: Can disable SysMain/Superfetch
- **No printer**: Can disable Print Spooler
- **No Bluetooth**: Can disable Bluetooth services
- **No Xbox**: Can disable Xbox services
- **Privacy focus**: Can disable telemetry services
- **Slow search**: Keep Windows Search enabled

## Examples

### Example 1: Quick optimization

```powershell
# User: "优化 Windows 启动"

# Disable SysMain on SSD
Set-Service -Name "SysMain" -StartupType Disabled
Stop-Service -Name "SysMain" -Force

# Disable Fax
Set-Service -Name "Fax" -StartupType Disabled

# Show status
Get-Service -Name "SysMain", "Fax" | Select-Object Name, Status, StartType
```

### Example 2: Gaming optimization

```powershell
# Disable non-essential services for gaming
$services = @("SysMain", "WSearch", "Fax", "MapsBroker")
foreach ($s in $services) {
    Set-Service -Name $s -StartupType Disabled -ErrorAction SilentlyContinue
}
```

### Example 3: Service troubleshooting

```powershell
# Service won't start - check dependencies
Get-Service -Name "ServiceName" -RequiredServices

# Check for errors
Get-EventLog -LogName System -Source "Service Control Manager" -Newest 10
```

## Checklist

- [ ] Running as Administrator
- [ ] Services to modify identified
- [ ] Dependencies checked
- [ ] Restore point created (for bulk changes)
- [ ] Startup type configured
- [ ] Service stopped (if disabling)
- [ ] Changes verified with Get-Service
- [ ] System rebooted to apply
- [ ] System stability verified after changes

## References

- Get-Service: https://docs.microsoft.com/powershell/module/microsoft.powershell.management/get-service
- Set-Service: https://docs.microsoft.com/powershell/module/microsoft.powershell.management/set-service
- Windows Services: https://docs.microsoft.com/windows/services/
- Black Viper's Service Guide: https://www.blackviper.com/
