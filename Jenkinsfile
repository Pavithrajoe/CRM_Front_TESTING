pipeline {
    agent any

    environment {
        BETA_HOST = '192.168.29.236'
        APP_DIR   = '/var/www/ocrm-beta'
        REPO_URL  = 'https://github.com/Pavithrajoe/CRM_Front_TESTING.git'
        PLINK     = 'C:\\Program Files (x86)\\PuTTY\\plink.exe'
        HOSTKEY   = 'ssh-ed25519 SHA256:imGQ86RxgWO2zpTEzF611KwaDE+L/jpadEGZ9nCbu1k'
    }

    stages {
        stage('Build & Deploy on Linux Beta Server') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'beta-linux-password',
                        usernameVariable: 'SSH_USER',
                        passwordVariable: 'SSH_PASS'
                    )
                ]) {
                    bat """
                    "%PLINK%" -batch -ssh %SSH_USER%@%BETA_HOST% -pw "%SSH_PASS%" -hostkey "%HOSTKEY%" "
                        rm -rf ${APP_DIR} &&
                        git clone ${REPO_URL} ${APP_DIR} &&
                        cd ${APP_DIR} &&
                        npm install --no-fund --no-audit &&
                        npm run build
                    "
                    """
                }
            }
        }
    }

    post {
        success {
            echo '✅ Successfully built and deployed to beta server'
        }
        failure {
            echo '❌ Beta deployment failed'
        }
    }
}
