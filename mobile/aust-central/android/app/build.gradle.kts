import java.util.Base64
import java.util.Properties

plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    // The google-services plugin is gone: the app no longer uses Firebase.
    // Auth and all feature data come from the AUST Central API (see /server).
}

/**
 * Release signing. The upload key and its passwords live in
 * android/key.properties (gitignored, never committed):
 *
 *   storeFile=/absolute/path/to/upload-keystore.jks
 *   storePassword=…
 *   keyAlias=upload
 *   keyPassword=…
 *
 * Generate the keystore once with:
 *   keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
 * and back it up: losing it means you can no longer publish updates.
 */
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) keystorePropertiesFile.inputStream().use { load(it) }
}

/** `--dart-define`s, which Flutter hands Gradle base64-encoded and comma-joined. */
val dartDefines: Map<String, String> =
    (project.findProperty("dart-defines") as String?)
        ?.split(",")
        ?.filter { it.isNotBlank() }
        ?.map { String(Base64.getDecoder().decode(it)) }
        ?.associate { it.substringBefore("=") to it.substringAfter("=", "") }
        ?: emptyMap()

android {
    namespace = "com.austpic.central"
    compileSdk = 36
    ndkVersion = "28.2.13676358"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.austpic.central"
        minSdk = flutter.minSdkVersion
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            // Never the debug key: Play rejects debug-signed uploads, and an
            // app signed with a throwaway key can never be updated.
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

flutter {
    source = "../.."
}

/**
 * Fail a release build up front, with an actionable message, instead of
 * producing an APK/AAB that cannot ship: one signed with nothing, or one that
 * talks to the emulator loopback (the ApiConfig fallback) instead of the API.
 */
gradle.taskGraph.whenReady {
    val buildingRelease = allTasks.any { task ->
        task.project == project &&
            (task.name.startsWith("assemble") || task.name.startsWith("bundle")) &&
            task.name.endsWith("Release")
    }
    if (!buildingRelease) return@whenReady

    if (!keystorePropertiesFile.exists()) {
        throw GradleException(
            "Release builds need android/key.properties (upload keystore). " +
                "See the comment above `keystorePropertiesFile` in android/app/build.gradle.kts.",
        )
    }
    val apiBaseUrl = dartDefines["API_BASE_URL"].orEmpty()
    if (!apiBaseUrl.startsWith("https://")) {
        throw GradleException(
            "Release builds need --dart-define=API_BASE_URL=https://<your-domain>/api/v1 " +
                "(got '${apiBaseUrl.ifEmpty { "<unset>" }}').",
        )
    }
}
