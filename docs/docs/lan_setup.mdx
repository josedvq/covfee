## WSL

Expose flask port:
netsh advfirewall firewall add rule name= "Open Port 5000" dir=in action=allow protocol=TCP localport=5000
netsh interface portproxy add v4tov4 listenport=5000 listenaddress=0.0.0.0 connectport=5000 connectaddress=172.23.144.79

Expose dev server port
netsh advfirewall firewall add rule name= "Open Port 8085" dir=in action=allow protocol=TCP localport=8085
netsh interface portproxy add v4tov4 listenport=8085 listenaddress=0.0.0.0 connectport=8085 connectaddress=172.23.144.79

Expose openvidu ports
netsh advfirewall firewall add rule name= "Open Port 8085" dir=in action=allow protocol=TCP localport=8085
netsh advfirewall firewall add rule name= "Open Port 8085" dir=in action=allow protocol=TCP localport=8085
netsh advfirewall firewall add rule name= "Open Port 8085" dir=in action=allow protocol=TCP localport=8085



Username and password: OPENVIDUAPP / MY_SECRET 

Chrome treat insecure as secure

chrome://flags/#unsafely-treat-insecure-origin-as-secure


## Script to bridge WSL ports

$ports = @(80, 443, 10000, 3000, 5000);

$wslAddress = bash.exe -c "ifconfig eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'"

if ($wslAddress -match '^(\d{1,3}\.){3}\d{1,3}$') {
  Write-Host "WSL IP address: $wslAddress" -ForegroundColor Green
  Write-Host "Ports: $ports" -ForegroundColor Green
}
else {
  Write-Host "Error: Could not find WSL IP address." -ForegroundColor Red
  exit
}

$listenAddress = '0.0.0.0';

foreach ($port in $ports) {
  Invoke-Expression "netsh interface portproxy delete v4tov4 listenport=$port listenaddress=$listenAddress";
  Invoke-Expression "netsh interface portproxy add v4tov4 listenport=$port listenaddress=$listenAddress connectport=$port connectaddress=$wslAddress";
}

## Add the task to powershell
$a = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File `"C:\Users\Jose\install\Bridge-WslPorts.ps1`" -WindowStyle Hidden -ExecutionPolicy Bypass"
$t = New-ScheduledTaskTrigger -AtLogon
$s = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$p = New-ScheduledTaskPrincipal -GroupId "BUILTIN\Administrators" -RunLevel Highest
Register-ScheduledTask -TaskName "WSL2PortsBridge" -Action $a -Trigger $t -Settings $s -Principal $p

## Run script manually
powershell -ExecutionPolicy Bypass -File C:\Users\Jose\install\Bridge-WslPorts.ps1

## Running for LAN access

covfee webpack --host 0.0.0.0

docker run -p 4443:4443 --rm -e DOMAIN_OR_PUBLIC_IP=192.168.0.22 -e OPENVIDU_SECRET=MY_SECRET openvidu/openvidu-dev:2.29.0

## Check portproxy

netsh interface portproxy show all