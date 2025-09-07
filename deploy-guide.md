# TripMate AWS 배포 가이드

## 🚀 빠른 시작

### 1. 로컬에서 Docker 빌드 및 테스트

```bash
# Docker 이미지 빌드
docker build -t tripmate:latest .

# 로컬에서 테스트
docker-compose up -d

# 애플리케이션 확인
curl http://localhost:80/actuator/health
```

### 2. AWS CLI 설정

```bash
# AWS CLI 설치 확인
aws --version

# AWS 자격 증명 설정
aws configure
# AWS Access Key ID: [입력]
# AWS Secret Access Key: [입력]
# Default region name: ap-northeast-2
# Default output format: json
```

### 3. ECR 리포지토리 생성 및 이미지 푸시

```bash
# 배포 스크립트 실행 권한 부여
chmod +x aws-deploy.sh

# AWS에 배포
./aws-deploy.sh ap-northeast-2 tripmate latest
```

### 4. AWS 인프라 생성

```bash
# CloudFormation 스택 생성
aws cloudformation create-stack \
  --stack-name tripmate-infrastructure \
  --template-body file://aws-infrastructure.yaml \
  --capabilities CAPABILITY_IAM \
  --parameters ParameterKey=Environment,ParameterValue=prod

# 스택 생성 완료 대기
aws cloudformation wait stack-create-complete \
  --stack-name tripmate-infrastructure
```

### 5. ECS 서비스 생성

```bash
# ECS 클러스터 확인
aws ecs describe-clusters --clusters tripmate-infrastructure-cluster

# 태스크 정의 등록
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json

# ECS 서비스 생성
aws ecs create-service \
  --cluster tripmate-infrastructure-cluster \
  --service-name tripmate-service \
  --task-definition tripmate-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:ap-northeast-2:ACCOUNT_ID:targetgroup/tripmate-infrastructure-tg/xxx,containerName=tripmate-backend,containerPort=80"
```

## 📋 상세 설정

### 환경 변수 설정

프로덕션 환경에서 필요한 환경 변수들:

```bash
# Spring Boot 설정
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=80

# 데이터베이스 설정
SPRING_DATASOURCE_URL=jdbc:mysql://database-endpoint:3306/tripmate
SPRING_DATASOURCE_USERNAME=admin
SPRING_DATASOURCE_PASSWORD=your-secure-password

# Redis 설정
SPRING_REDIS_HOST=redis-endpoint
SPRING_REDIS_PORT=6379
```

### 보안 설정

1. **AWS Secrets Manager** 사용
2. **IAM 역할** 최소 권한 원칙
3. **VPC** 내부 통신만 허용
4. **HTTPS** 인증서 설정 (선택사항)

### 모니터링 설정

1. **CloudWatch** 로그 수집
2. **X-Ray** 분산 추적
3. **CloudWatch** 메트릭 모니터링

## 🔧 문제 해결

### 일반적인 문제들

1. **Docker 빌드 실패**
   ```bash
   # 캐시 없이 빌드
   docker build --no-cache -t tripmate:latest .
   ```

2. **ECS 태스크 시작 실패**
   ```bash
   # 태스크 로그 확인
   aws logs get-log-events \
     --log-group-name /ecs/tripmate \
     --log-stream-name ecs/tripmate-backend/container-id
   ```

3. **데이터베이스 연결 실패**
   - 보안 그룹 규칙 확인
   - 데이터베이스 엔드포인트 확인
   - 자격 증명 확인

### 로그 확인

```bash
# ECS 서비스 로그
aws logs describe-log-groups --log-group-name-prefix /ecs/tripmate

# 특정 로그 스트림 확인
aws logs get-log-events \
  --log-group-name /ecs/tripmate \
  --log-stream-name ecs/tripmate-backend/container-id \
  --start-time $(date -d '1 hour ago' +%s)000
```

## 📊 비용 최적화

### 리소스 크기 조정

- **ECS 태스크**: CPU 1024, Memory 2048 (필요에 따라 조정)
- **RDS**: db.t3.micro (개발용), db.t3.small (프로덕션)
- **Redis**: cache.t3.micro (개발용), cache.t3.small (프로덕션)

### 자동 스케일링

```bash
# ECS 서비스 자동 스케일링 설정
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/tripmate-infrastructure-cluster/tripmate-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 10
```

## 🔄 CI/CD 파이프라인

### GitHub Actions 예시

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      - name: Build and push Docker image
        run: ./aws-deploy.sh ap-northeast-2 tripmate ${{ github.sha }}
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster tripmate-infrastructure-cluster \
            --service tripmate-service \
            --force-new-deployment
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **AWS CloudWatch** 로그
2. **ECS 태스크** 상태
3. **보안 그룹** 규칙
4. **네트워크** 연결성

추가 도움이 필요하면 개발팀에 문의하세요.
