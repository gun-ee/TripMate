#!/bin/bash

# AWS 배포 스크립트
# 사용법: ./aws-deploy.sh [AWS_REGION] [ECR_REPOSITORY_NAME]

set -e

# 변수 설정
AWS_REGION=${1:-ap-northeast-2}  # 기본값: 서울
ECR_REPOSITORY=${2:-tripmate}
IMAGE_TAG=${3:-latest}
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 TripMate AWS 배포 시작"
echo "Region: $AWS_REGION"
echo "Repository: $ECR_REPOSITORY"
echo "Account ID: $ACCOUNT_ID"

# 1. Docker 이미지 빌드
echo "📦 Docker 이미지 빌드 중..."
docker build -t $ECR_REPOSITORY:$IMAGE_TAG .

# 2. ECR 로그인
echo "🔐 ECR 로그인 중..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# 3. ECR 리포지토리 생성 (없는 경우)
echo "📋 ECR 리포지토리 확인 중..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# 4. 이미지 태그 및 푸시
echo "🏷️ 이미지 태그 설정 중..."
docker tag $ECR_REPOSITORY:$IMAGE_TAG $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

echo "⬆️ 이미지 푸시 중..."
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

echo "✅ 배포 완료!"
echo "이미지 URI: $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
echo ""
echo "다음 단계:"
echo "1. ECS 클러스터 생성"
echo "2. ECS 서비스 생성"
echo "3. Application Load Balancer 설정"
echo "4. RDS MySQL 인스턴스 생성"
