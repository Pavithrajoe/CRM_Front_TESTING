pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                bat '''
                npm config set script-shell cmd
                npm install
                npm rebuild
                '''
            }
        }

        stage('Build') {
            steps {
                echo 'Building React app using npm (Vite)...'
                bat 'npm run build'
            }
        }
    }

    post {
        success {
            echo '✅ Build completed successfully!'
        }
        failure {
            echo '❌ Build failed. Check console output.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
