# syntax=docker/dockerfile:1

# ============================================================
# Build-Stage: kompiliert das Spring Boot JAR mit dem Maven Wrapper
# JDK + Maven Cache bleiben in dieser Stage und landen NICHT im finalen Image
# ============================================================
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /build

# Maven Wrapper + POM zuerst (Layer-Cache fuer Dependencies)
COPY .mvn .mvn
COPY mvnw pom.xml ./

# Windows CRLF-Fix fuer mvnw
RUN sed -i 's/\r$//' mvnw \
    && chmod +x mvnw

# Dependencies vorab herunterladen (besseres Layer-Caching)
RUN ./mvnw dependency:go-offline -B

# Source kopieren und JAR bauen (Tests werden im build.yml separat ausgefuehrt)
COPY src src
RUN ./mvnw -Dmaven.test.skip=true package -B \
    && cp target/consumer-0.0.1-SNAPSHOT.jar /build/app.jar

# ============================================================
# Runtime-Stage: nur JRE + das fertige JAR
# Kein JDK, kein Maven, keine Sourcen -> deutlich kleineres Image
# ============================================================
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

COPY --from=builder /build/app.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
