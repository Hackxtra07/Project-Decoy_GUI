import os
import subprocess

def clean_windows_persistence():
    print("Starting Windows Persistence Cleanup...")
    mask_name = "ChromeUpdate"
    
    # 1. Registry cleanup
    try:
        import winreg
        print("Cleaning Registry Run keys...")
        for hkey in [winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE]:
            try:
                key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
                with winreg.OpenKey(hkey, key_path, 0, winreg.KEY_ALL_ACCESS) as key:
                    winreg.DeleteValue(key, mask_name)
                    print(f"[+] Registry Run key removed from {hkey}")
            except FileNotFoundError:
                print(f"[-] No Registry Run key found in {hkey}")
            except Exception as e:
                print(f"[!] Registry cleanup error: {e}")
    except Exception as e:
        print(f"[!] Winreg module error: {e}")

    # 2. Scheduled Task cleanup
    try:
        print("Cleaning Scheduled Tasks...")
        res = subprocess.run(f'schtasks /delete /f /tn "{mask_name}"', shell=True, capture_output=True, text=True)
        if res.returncode == 0:
            print("[+] Scheduled Task deleted")
        else:
            print("[-] Scheduled Task not found or already clean")
    except Exception as e:
        print(f"[!] Scheduled Task cleanup error: {e}")

    # 3. Startup Folder cleanup
    try:
        print("Cleaning Startup Folder...")
        startup_path = os.path.join(os.environ.get('APPDATA', ''), r"Microsoft\Windows\Start Menu\Programs\Startup")
        vbs_path = os.path.join(startup_path, f"{mask_name}.vbs")
        if os.path.exists(vbs_path):
            os.remove(vbs_path)
            print("[+] Startup VBS removed")
        else:
            print("[-] Startup VBS not found")
    except Exception as e:
        print(f"[!] Startup Folder cleanup error: {e}")

    # 5. WMI Persistence cleanup (very stealthy)
    try:
        print("Cleaning WMI Persistence...")
        # Remove WMI Filter
        subprocess.run(['powershell', '-Command', "Get-WmiObject -Namespace root/subscription -Class __EventFilter -Filter \"Name='SnakeUpdate'\" | Remove-WmiObject"], capture_output=True)
        # Remove WMI Consumer
        subprocess.run(['powershell', '-Command', "Get-WmiObject -Namespace root/subscription -Class CommandLineEventConsumer -Filter \"Name='SnakeUpdate'\" | Remove-WmiObject"], capture_output=True)
        # Remove Binding
        subprocess.run(['powershell', '-Command', "Get-WmiObject -Namespace root/subscription -Class __FilterToConsumerBinding -Filter \"Filter='__EventFilter.Name=\\\"SnakeUpdate\\\"'\" | Remove-WmiObject"], capture_output=True)
        print("[+] WMI Persistence 'SnakeUpdate' cleared (if existed)")
    except Exception as e:
        print(f"[!] WMI cleanup error: {e}")

    # 6. Kill running RAT processes
    try:
        print("Killing running RAT processes (python/pythonw/updater)...")
        # Try finding processes by name or command line specifically
        subprocess.run(['taskkill', '/F', '/IM', 'updater.exe'], capture_output=True)
        
        # Kill pythonw.exe if it's running updater.pyw
        # This is harder without a full process list filter but we can try common ones
        wmic_cmd = "wmic process where \"CommandLine like '%updater.pyw%'\" call terminate"
        subprocess.run(wmic_cmd, shell=True, capture_output=True)
        print("[+] Any active RAT process instances terminated")
    except Exception as e:
        print(f"[!] Process termination error: {e}")
        
    print("Cleanup Completed.")

if __name__ == "__main__":
    clean_windows_persistence()
