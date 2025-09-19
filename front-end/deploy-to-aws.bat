@echo off
echo 🚀 AWS Deployment Script - Polling Solution
echo ==========================================

echo.
echo 📦 Checking build files...
if not exist "dist\index.html" (
    echo ❌ Build files not found! Running build...
    call npm run build
    if errorlevel 1 (
        echo ❌ Build failed!
        pause
        exit /b 1
    )
)

echo ✅ Build files ready!

echo.
echo 📋 Deployment Options:
echo 1. AWS S3 + CloudFront (Recommended)
echo 2. AWS Amplify
echo 3. Manual upload to EC2
echo 4. Show deployment guide

set /p choice="Choose deployment method (1-4): "

if "%choice%"=="1" goto s3_deploy
if "%choice%"=="2" goto amplify_deploy
if "%choice%"=="3" goto ec2_deploy
if "%choice%"=="4" goto show_guide
goto invalid_choice

:s3_deploy
echo.
echo 🪣 S3 + CloudFront Deployment
echo ============================
echo.
echo 1. Install AWS CLI: https://aws.amazon.com/cli/
echo 2. Configure AWS CLI: aws configure
echo 3. Run these commands:
echo.
echo    aws s3 mb s3://your-bucket-name
echo    aws s3 sync dist/ s3://your-bucket-name --delete
echo    aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
echo.
echo 4. Create CloudFront distribution pointing to your S3 bucket
echo 5. Set error pages: 404 -> index.html (for React Router)
echo.
goto end

:amplify_deploy
echo.
echo ⚡ AWS Amplify Deployment
echo ========================
echo.
echo 1. Go to AWS Amplify Console
echo 2. Connect your repository
echo 3. Use these build settings:
echo.
echo    version: 1
echo    frontend:
echo      phases:
echo        preBuild:
echo          commands:
echo            - npm install
echo        build:
echo          commands:
echo            - npm run build
echo      artifacts:
echo        baseDirectory: dist
echo        files:
echo          - '**/*'
echo.
goto end

:ec2_deploy
echo.
echo 🖥️ EC2 Manual Deployment
echo =======================
echo.
echo 1. Upload dist/ folder contents to your EC2 server
echo 2. Configure Nginx:
echo.
echo    server {
echo        listen 80;
echo        server_name your-domain.com;
echo        root /var/www/html;
echo        index index.html;
echo        
echo        location / {
echo            try_files $uri $uri/ /index.html;
echo        }
echo    }
echo.
goto end

:show_guide
echo.
echo 📖 Opening deployment guide...
start aws-deployment-guide.md
goto end

:invalid_choice
echo ❌ Invalid choice! Please run the script again.
goto end

:end
echo.
echo 🎉 Polling Solution Ready for Deployment!
echo.
echo ✅ WebSocket errors will be eliminated
echo ✅ Data updates every 30 seconds
echo ✅ Visual feedback for users
echo ✅ Reliable performance
echo.
echo 📁 Your built files are in the 'dist' folder
echo 📖 See 'aws-deployment-guide.md' for detailed instructions
echo.
pause
