#include "gsplatCommonVS"

varying mediump vec2 gaussianUV;
varying mediump vec4 gaussianColor;
uniform float uTime;
uniform float uSwirlAmount;
uniform float uNoiseScale;
uniform int uShaderMode; // 0=Original, 1=FastCurl, 2=SimpleSwirl, 3=Julia, 4=FastJulia, 5=PseudoJulia, 6=TrigJulia

#ifndef DITHER_NONE
    varying float id;
#endif

mediump vec4 discardVec = vec4(0.0, 0.0, 2.0, 1.0);

// ===== ORIGINAL COMPLEX SWIRL SHADER =====
uvec2 _pcg4d16(uvec4 p)
{
    uvec4 v = p * 1664525u + 1013904223u;
    v.x += v.y*v.w; v.y += v.z*v.x; v.z += v.x*v.y; v.w += v.y*v.z;
    v.x += v.y*v.w; v.y += v.z*v.x;
    return v.xy;
}

vec4 _gradient4d(uint hash)
{
    vec4 g = vec4(uvec4(hash) & uvec4(0x80000, 0x40000, 0x20000, 0x10000));
    return g * (1.0 / vec4(0x40000, 0x20000, 0x10000, 0x8000)) - 1.0;
}

vec3 BitangentNoise4D(vec4 p)
{
    const vec4 F4 = vec4(0.309016994374947451);
    const vec4 C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);

    vec4 i = floor(p + dot(p, F4));
    vec4 x0 = p - i + dot(i, C.xxxx);

    vec4 i0;
    vec3 isX = step(x0.yzw, x0.xxx);
    vec3 isYZ = step(x0.zww, x0.yyz);
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;
    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    vec4 i3 = clamp(i0, 0.0, 1.0);
    vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
    vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

    vec4 x1 = x0 - i1 + C.xxxx;
    vec4 x2 = x0 - i2 + C.yyyy;
    vec4 x3 = x0 - i3 + C.zzzz;
    vec4 x4 = x0 + C.wwww;

    i = i + 32768.5;
    uvec2 hash0 = _pcg4d16(uvec4(i));
    uvec2 hash1 = _pcg4d16(uvec4(i + i1));
    uvec2 hash2 = _pcg4d16(uvec4(i + i2));
    uvec2 hash3 = _pcg4d16(uvec4(i + i3));
    uvec2 hash4 = _pcg4d16(uvec4(i + 1.0));

    vec4 p00 = _gradient4d(hash0.x); vec4 p01 = _gradient4d(hash0.y);
    vec4 p10 = _gradient4d(hash1.x); vec4 p11 = _gradient4d(hash1.y);
    vec4 p20 = _gradient4d(hash2.x); vec4 p21 = _gradient4d(hash2.y);
    vec4 p30 = _gradient4d(hash3.x); vec4 p31 = _gradient4d(hash3.y);
    vec4 p40 = _gradient4d(hash4.x); vec4 p41 = _gradient4d(hash4.y);

    vec3 m0 = clamp(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0, 1.0);
    vec2 m1 = clamp(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0, 1.0);
    vec3 m02 = m0 * m0; vec3 m03 = m02 * m0;
    vec2 m12 = m1 * m1; vec2 m13 = m12 * m1;

    vec3 temp0 = m02 * vec3(dot(p00, x0), dot(p10, x1), dot(p20, x2));
    vec2 temp1 = m12 * vec2(dot(p30, x3), dot(p40, x4));
    vec4 grad0 = -6.0 * (temp0.x * x0 + temp0.y * x1 + temp0.z * x2 + temp1.x * x3 + temp1.y * x4);
    grad0 += m03.x * p00 + m03.y * p10 + m03.z * p20 + m13.x * p30 + m13.y * p40;

    temp0 = m02 * vec3(dot(p01, x0), dot(p11, x1), dot(p21, x2));
    temp1 = m12 * vec2(dot(p31, x3), dot(p41, x4));
    vec4 grad1 = -6.0 * (temp0.x * x0 + temp0.y * x1 + temp0.z * x2 + temp1.x * x3 + temp1.y * x4);
    grad1 += m03.x * p01 + m03.y * p11 + m03.z * p21 + m13.x * p31 + m13.y * p41;

    return cross(grad0.xyz, grad1.xyz) * 81.0;
}

vec3 originalSwirlEffect(vec3 pos, float amount) {
    float timeScale = 0.15;
    vec3 curlVelocity = BitangentNoise4D(vec4(pos * uNoiseScale, uTime * timeScale));
    return pos + (curlVelocity * 0.16 * amount);
}

// ===== OPTIMIZED FAST CURL NOISE =====
vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    
    return mix(mix(mix(dot(hash3(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
                       dot(hash3(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
                   mix(dot(hash3(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
                       dot(hash3(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
               mix(mix(dot(hash3(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
                       dot(hash3(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
                   mix(dot(hash3(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
                       dot(hash3(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

vec3 fastCurlNoise(vec3 pos, float time) {
    float timeScale = 0.15;
    vec3 p = pos * uNoiseScale;
    float t = time * timeScale;
    float eps = 0.1;
    
    float n1 = noise3D(p + vec3(0.0, eps, 0.0) + t);
    float n2 = noise3D(p + vec3(0.0, -eps, 0.0) + t);
    float n3 = noise3D(p + vec3(eps, 0.0, 0.0) + t);
    float n4 = noise3D(p + vec3(-eps, 0.0, 0.0) + t);
    float n5 = noise3D(p + vec3(0.0, 0.0, eps) + t);
    float n6 = noise3D(p + vec3(0.0, 0.0, -eps) + t);
    
    vec3 curl;
    curl.x = (n1 - n2) / (2.0 * eps);
    curl.y = (n5 - n6) / (2.0 * eps);
    curl.z = (n4 - n3) / (2.0 * eps);
    
    return pos + curl * 0.16 * uSwirlAmount;
}

// ===== SIMPLE SWIRL EFFECT =====
vec3 simpleSwirlEffect(vec3 pos, float amount, float time) {
    float timeScale = 0.15;
    vec3 p = pos * uNoiseScale;
    float t = time * timeScale;
    
    vec3 swirl1 = vec3(
        sin(p.x * 2.0 + p.z * 1.5 + t) * cos(p.y * 1.8 + t * 0.7),
        cos(p.z * 2.2 + p.x * 1.3 + t * 1.1) * sin(p.y * 1.6 + t * 0.8),
        sin(p.y * 2.1 + p.x * 1.7 + t * 0.9) * cos(p.z * 1.4 + t * 1.2)
    );
    
    vec3 swirl2 = vec3(
        cos(p.x * 4.3 + p.y * 2.1 + t * 1.3) * sin(p.z * 3.2 + t * 0.6),
        sin(p.z * 3.8 + p.x * 2.7 + t * 0.95) * cos(p.y * 4.1 + t * 1.4),
        cos(p.y * 3.5 + p.z * 2.9 + t * 1.15) * sin(p.x * 3.7 + t * 0.85)
    ) * 0.5;
    
    vec3 combinedSwirl = (swirl1 + swirl2) * 0.08;
    return pos + combinedSwirl * amount;
}

// ===== JULIA SET FUNCTIONS =====
vec4 qLn(vec4 a){
    float r = length(a.xyz);
    float t = r>0.00001 ? atan(r,a.w)/r : 0.0;
    return vec4(a.xyz * t ,0.5 * log(length(a)));
}

vec4 qExp(vec4 a){
    float r = length(a.xyz);
    float et = exp(a.w);
    float s = r>=0.00001 ? et * sin(r)/r : 0.0;
    return vec4(a.xyz * s, et * cos(r));
}

vec4 qPow(vec4 a, float n){
    float originalLength = length(a);
    vec4 normalizedA = normalize(a);
    return qExp(qLn(normalizedA) * n) * originalLength;
}

vec3 originalJulia(vec3 p, vec4 c, float iterations) {
    vec4 z = vec4(p, 0.2);
    int stepCount = int(ceil(iterations));
    float finalT = fract(iterations);
    float finalPower = (finalT * 2.0) + 1.0;
    
    for(int i = 0; i < stepCount; i++) {
        float currentPower = i==(stepCount-1) ? finalPower : 3.0;
        float currentT = i==(stepCount-1) ? finalT : 1.0;
        z = qPow(z, currentPower) + qPow(c, currentT);
    }
    return z.xyz;
}

// ===== OPTIMIZED JULIA FUNCTIONS =====
vec4 qPowFast(vec4 q, float n) {
    if (n <= 1.0) return q;
    if (n <= 2.0) {
        float w2 = q.w * q.w;
        float v2 = dot(q.xyz, q.xyz);
        return vec4(2.0 * q.w * q.xyz, w2 - v2);
    }
    
    vec4 q2 = vec4(2.0 * q.w * q.xyz, q.w * q.w - dot(q.xyz, q.xyz));
    return vec4(
        q.w * q2.xyz + q2.w * q.xyz + cross(q.xyz, q2.xyz),
        q.w * q2.w - dot(q.xyz, q2.xyz)
    );
}

vec3 fastJulia(vec3 p, vec4 c, float time) {
    vec4 z = vec4(p, 0.2);
    
    // Smooth animation instead of discrete iteration changes
    float smoothTime = time * 0.8;
    float power = 2.0 + sin(smoothTime * 0.3) * 1.0; // Smooth power variation
    
    // Fixed iterations but with smooth temporal influence
    for (int i = 0; i < 4; i++) {
        // Apply temporal influence to each iteration
        float iterInfluence = sin(smoothTime + float(i) * 1.5) * 0.1;
        vec4 tempC = c + vec4(iterInfluence, iterInfluence * 0.5, iterInfluence * 0.3, 0.0);
        
        z = qPowFast(z, power) + tempC;
        
        // Smooth scaling instead of hard cutoff
        float scale = 0.85 + sin(smoothTime * 0.4 + float(i)) * 0.1;
        z *= scale;
        
        if (dot(z, z) > 4.0) break;
    }
    
    // Add smooth post-processing for flowing motion
    vec3 result = z.xyz;
    result += vec3(
        sin(time * 0.5 + p.x) * cos(time * 0.3 + p.y) * 0.05,
        cos(time * 0.6 + p.y) * sin(time * 0.4 + p.z) * 0.05,
        sin(time * 0.7 + p.z) * cos(time * 0.2 + p.x) * 0.05
    );
    
    return result;
}

vec3 pseudoJulia(vec3 p, float time) {
    vec3 z = p * 0.5;
    float t = time * 0.2;
    
    // Dynamic Julia constant that changes over time
    vec3 c = vec3(
        -0.1 + sin(t) * 0.15 + cos(t * 0.7) * 0.1,
        0.6 + cos(t * 0.9) * 0.2 + sin(t * 1.3) * 0.1,
        0.9 + sin(t * 1.1) * 0.15
    );
    
    // Dynamic iteration count
    float timeVar = sin(time * 0.4) * 0.5 + 0.5;
    int maxIter = int(2.0 + timeVar * 4.0); // 2 to 6 iterations
    
    for (int i = 0; i < 6; i++) {
        if (i >= maxIter) break;
        
        // More complex 3D operations with time variation
        float x2 = z.x * z.x;
        float y2 = z.y * z.y;
        float z2 = z.z * z.z;
        
        // Add time-based variation to the formula
        float timeInfluence = sin(time * 0.6 + float(i)) * 0.1;
        
        z = vec3(
            x2 - y2 - z2 + c.x + timeInfluence,
            2.0 * z.x * z.y + c.y,
            2.0 * z.x * z.z + c.z + timeInfluence * 0.5
        );
        
        // Dynamic scaling based on iteration
        z *= (0.8 + sin(time * 0.5) * 0.2);
        
        if (dot(z, z) > 4.0) break;
    }
    
    return z * 0.3;
}

vec3 trigJulia(vec3 p, float time) {
    float t = time * 0.3;
    vec3 scaled = p * 2.0;
    vec3 result = scaled;
    
    // Create multiple frequency layers that change over time
    float freq1 = 1.5 + sin(time * 0.2) * 0.5; // Varying frequency
    float freq2 = 2.8 + cos(time * 0.3) * 0.8;
    float freq3 = 1.8 + sin(time * 0.25) * 0.6;
    
    // Dynamic amplitudes
    float amp1 = 0.3 + sin(time * 0.4) * 0.15;
    float amp2 = 0.15 + cos(time * 0.35) * 0.1;
    
    // First layer - with dynamic frequencies
    result.x += sin(scaled.y * freq1 + t) * cos(scaled.z * freq2 + t * 0.8) * amp1;
    result.y += cos(scaled.z * freq2 + t * 1.1) * sin(scaled.x * freq3 + t * 0.6) * amp1;
    result.z += sin(scaled.x * freq3 + t * 0.9) * cos(scaled.y * freq1 + t * 1.2) * amp1;
    
    // Second layer - with phase shifts that change over time
    float phaseShift = time * 1.5;
    result.x += sin(scaled.x * 3.0 + scaled.y * 2.0 + t * 2.0 + phaseShift) * amp2;
    result.y += cos(scaled.y * 2.8 + scaled.z * 1.9 + t * 1.8 + phaseShift * 0.7) * amp2;
    result.z += sin(scaled.z * 2.6 + scaled.x * 2.2 + t * 2.2 + phaseShift * 1.3) * amp2;
    
    // Third layer - micro variations
    float microTime = time * 3.0;
    result += vec3(
        sin(scaled.x * 5.0 + microTime) * cos(scaled.y * 4.5 + microTime * 0.8),
        cos(scaled.y * 4.8 + microTime * 1.2) * sin(scaled.z * 5.2 + microTime * 0.9),
        sin(scaled.z * 4.6 + microTime * 1.1) * cos(scaled.x * 5.1 + microTime * 1.3)
    ) * 0.08;
    
    return result;
}

void main(void) {
    SplatSource source;
    if (!initSource(source)) {
        gl_Position = discardVec;
        return;
    }

    vec3 modelCenter = readCenter(source);
    vec3 swirlCenter;
    
    // Switch between different effects based on uShaderMode
    if (uShaderMode == 0) {
        // Original complex swirl
        swirlCenter = originalSwirlEffect(modelCenter, uSwirlAmount);
    } else if (uShaderMode == 1) {
        // Fast curl noise
        swirlCenter = fastCurlNoise(modelCenter, uTime);
    } else if (uShaderMode == 2) {
        // Simple swirl effect
        swirlCenter = simpleSwirlEffect(modelCenter, uSwirlAmount, uTime);
    } else if (uShaderMode == 3) {
        // Original Julia set
        vec4 c = vec4(-0.1, 0.6, 0.9, -0.3);
        vec3 juliaResult = originalJulia(modelCenter * uNoiseScale, c, uTime / 5.0);
        swirlCenter = modelCenter + juliaResult * 0.15 * uSwirlAmount;
    } else if (uShaderMode == 4) {
        // Fast Julia set - now with smooth flowing animation
        vec4 c = vec4(-0.1, 0.6, 0.9, -0.3);
        // Smooth time variation instead of sharp changes
        c.xy += vec2(sin(uTime * 0.08), cos(uTime * 0.12)) * 0.15;
        c.z += sin(uTime * 0.1) * 0.1;
        vec3 juliaResult = fastJulia(modelCenter * uNoiseScale, c, uTime / 3.0);
        swirlCenter = modelCenter + juliaResult * 0.15 * uSwirlAmount;
    } else if (uShaderMode == 5) {
        // Pseudo Julia (3D approximation)
        vec3 juliaResult = pseudoJulia(modelCenter * uNoiseScale, uTime / 5.0);
        swirlCenter = modelCenter + juliaResult * uSwirlAmount;
    } else if (uShaderMode == 6) {
        // Trigonometric Julia approximation
        vec3 juliaResult = trigJulia(modelCenter * uNoiseScale, uTime / 5.0);
        swirlCenter = modelCenter + (juliaResult - modelCenter * uNoiseScale) * uSwirlAmount;
    } else {
        // Default to no effect
        swirlCenter = modelCenter;
    }

    SplatCenter center;
    initCenter(source, swirlCenter, center);

    SplatCorner corner;
    if (!initCorner(source, center, corner)) {
        gl_Position = discardVec;
        return;
    }

    vec4 clr = readColor(source);

    #if SH_BANDS > 0
        vec3 dir = normalize(center.view * mat3(center.modelView));
        clr.xyz += evalSH(source, dir);
    #endif

    clipCorner(corner, clr.w);

    gl_Position = center.proj + vec4(corner.offset, 0, 0);
    gaussianUV = corner.uv;
    gaussianColor = vec4(prepareOutputFromGamma(max(clr.xyz, 0.0)), clr.w);

    #ifndef DITHER_NONE
        id = float(source.id);
    #endif
}