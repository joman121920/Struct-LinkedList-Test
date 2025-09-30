@'
#!/bin/bash
set -o errexit
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

cd Struct



python manage.py collectstatic --no-input
python manage.py migrate
'@ | Set-Content -Path Struct\build.sh -Encoding UTF8



# if [[ $CREATE_SUPERUSER ]]
# then
#     python struct/manage.py createsuperuser --no-input
# fi

# #!/bin/bash
# set -o errexit
# # Install dependencies
# pip install -r requirements.txt

# # Move into backend folder
# cd Struct 

# # Django setup
# python manage.py collectstatic --no-input
# python manage.py migrate
