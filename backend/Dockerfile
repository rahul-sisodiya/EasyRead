# ================================
# Stage 1 — Build
# ================================

FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /build

COPY pom.xml .

RUN mvn -B -q dependency:go-offline -DskipTests

COPY src ./src

RUN mvn -B -q clean package -DskipTests


# ================================
# Stage 2 — Runtime
# ================================

FROM eclipse-temurin:17-jre-alpine AS runtime

LABEL org.opencontainers.image.title="EasyReads Backend"
LABEL org.opencontainers.image.description="Spring Boot PDF Reader Backend"
LABEL org.opencontainers.image.version="1.0.0"

# Create non-root user
RUN addgroup -S -g 1000 spring && \
    adduser -S -u 1000 -G spring spring

WORKDIR /app

EXPOSE 8080

# Copy generated Spring Boot JAR
COPY --from=build --chown=spring:spring /build/target/*.jar /app/app.jar

USER spring:spring

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar /app/app.jar"]