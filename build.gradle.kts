import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.7.10"
    kotlin("plugin.serialization") version "1.7.10"
}

group = "kr.minibus"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
    implementation("io.vertx:vertx-core:4.3.3")
    implementation("io.vertx:vertx-lang-kotlin:4.3.3")
    implementation("io.vertx:vertx-web:4.3.3")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.4.0")
}

tasks.test {
    useJUnitPlatform()
}

tasks.withType<KotlinCompile> {
    kotlinOptions.jvmTarget = "1.8"
}