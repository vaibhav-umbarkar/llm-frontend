pipeline {
    agent any

    stages {
        stage('Checkout'){
            steps {
                checkout scm
            }
        }

        stage('Tests'){
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                }
            }

            steps {
                sh 'rm -rf node_module'
                sh 'npm ci'
                sh 'npm run test -- --run'
            }
        }

        stage('Build Docker Image'){
            steps {
                sh "docker build -t llm-frontend:${BUILD_NUMBER} ."
            }
        }
    }
}