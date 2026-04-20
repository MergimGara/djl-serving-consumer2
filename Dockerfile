# docker build -t mergimgara/djl-serving-consumer2 .
FROM eclipse-temurin:21-jdk-jammy

WORKDIR /usr/src/app
COPY src src
COPY .mvn .mvn
COPY pom.xml mvnw ./

RUN sed -i 's/\r$//' mvnw
RUN chmod +x mvnw
RUN ./mvnw -Dmaven.test.skip=true package

EXPOSE 8082
CMD ["java","-jar","/usr/src/app/target/consumer-0.0.1-SNAPSHOT.jar"]
