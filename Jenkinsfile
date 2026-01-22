pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo 'Building React application...'
                bat 'npm run build'
            }
        }
    }

    post {
        success {
            echo '✅ Build completed successfully!'
        }
        failure {
            echo '❌ Build failed. Check console logs.'
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
