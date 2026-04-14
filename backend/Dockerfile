FROM bellsoft/liberica-openjdk-debian:25
# Create a dedicated system group and user for the app. The arguments keep the
# account minimal: --system avoids a regular login account, --no-create-home
# skips an unnecessary home directory, and --shell /usr/sbin/no login prevents
# interactive shell access. Running as this non-root user reduces container risk.
RUN groupadd --system spring && useradd --system --gid spring --no-create-home --shell /usr/sbin/nologin spring
USER spring:spring
COPY --chown=spring:spring application app
WORKDIR /app
ENTRYPOINT ["java", "-XX:AOTCache=app.aot", "-jar", "main-1.0-SNAPSHOT.jar"]