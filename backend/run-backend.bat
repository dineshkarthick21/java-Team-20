@echo off
setlocal

set "JAVA_HOME=C:\Program Files\Java\jdk-17"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Starting Spring Boot Application...
echo JAVA_HOME: %JAVA_HOME%

"%JAVA_HOME%\bin\java.exe" -version

cd /d "%~dp0"

echo Downloading Maven Wrapper...
powershell -Command "Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar' -OutFile '.mvn\wrapper\maven-wrapper.jar'"

echo Running Maven Spring Boot...
call mvnw.cmd spring-boot:run

endlocal
