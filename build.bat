@echo off

set BASE_DIR=%~dp0
set NODE_PATH=%BASE_DIR%node_modules
set GULP_PATH=%BASE_DIR%node_modules\gulp\bin\gulp.js

rem Check if node_modules has been unzipped
if exist %NODE_PATH%\nul goto NODE_MODULES_INSTALLED
echo ERROR: Node.js modules not found - must unzip node_modules.7z
goto FAIL

:NODE_MODULES_INSTALLED
echo node_modules OK

rem delete build diretory
if exist %BASE_DIR%build\nul rmdir /s /q %BASE_DIR%\build

mkdir build

cd src
echo Building project
node %GULP_PATH% build

if "%ERRORLEVEL%" NEQ "0" GOTO FAIL

cd ..
echo Copying files to build
copy index.jss build
copy template.html build
mkdir build\js
mkdir build\css
mkdir build\fonts
move build\angular-filemanager.min.js build\js
move build\angular-filemanager.min.css build\css
copy bower_components\jquery\dist\jquery.min.js build\js
copy bower_components\angular\angular.min.js build\js
copy bower_components\angular\angular.min.js.map build\js
copy bower_components\angular-translate\angular-translate.min.js build\js
copy bower_components\ng-file-upload\ng-file-upload.min.js build\js
copy bower_components\bootstrap\dist\js\bootstrap.min.js build\js
copy bower_components\bootswatch\paper\bootstrap.min.css build\css
copy bower_components\bootswatch\fonts\*.* build\fonts

GOTO :SUCCESS

:FAIL
echo Build failed!
cd %BASE_DIR%
EXIT /B 1

:SUCCESS
echo Build successful!
cd %BASE_DIR%
EXIT /B 0


