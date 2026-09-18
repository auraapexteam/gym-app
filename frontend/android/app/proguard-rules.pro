# Add project specific ProGuard rules here.
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.react.**

# OkHttp & Retrofit
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Worklets & Reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.worklets.** { *; }

# Razorpay
-keep class com.razorpay.** { *; }
-dontwarn com.razorpay.**

# Suppress harmless warnings
-dontwarn javax.annotation.**
-dontwarn org.checkerframework.**
