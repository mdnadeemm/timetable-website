import os
import shutil

# Check what PATH Python sees
print("Python PATH:")
for path in os.environ.get('PATH', '').split(os.pathsep):
    print(f"  {path}")

# Check if gcloud exists in any PATH directory
print("\nSearching for gcloud...")
gcloud_path = shutil.which('gcloud')
print(f"shutil.which('gcloud') = {gcloud_path}")

# Manually check common locations
print("\nManual check:")
import os
for path in os.environ.get('PATH', '').split(os.pathsep):
    gcloud_exe = os.path.join(path, 'gcloud.exe')
    gcloud_cmd = os.path.join(path, 'gcloud.cmd')
    if os.path.exists(gcloud_exe):
        print(f"Found: {gcloud_exe}")
    if os.path.exists(gcloud_cmd):
        print(f"Found: {gcloud_cmd}")