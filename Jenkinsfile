pipeline {
    agent any

    environment {
        BETA_HOST = '192.168.29.236'
        APP_DIR   = '/var/www/ocrm-beta'
        REPO_URL  = 'https://github.com/Pavithrajoe/CRM_Front_TESTING.git'
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
                    echo y | "C:\\Program Files\\PuTTY\\plink.exe" -ssh %SSH_USER%@%BETA_HOST% -pw "%SSH_PASS%" "
                        if [ ! -d ${APP_DIR}/.git ]; then
                            git clone ${REPO_URL} ${APP_DIR}
                        else
                            cd ${APP_DIR} && git pull
                        fi

                        cd ${APP_DIR}
                        npm install --no-fund --no-audit
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
