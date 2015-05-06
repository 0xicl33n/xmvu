
/* IMVU shader effects for the per-pixel version of the renderer */

struct LightParam {
    float4          Position;
    float3          DiffuseColor;
    int             _pad0;
    float3          SpecularColor;
    int             _pad1;
    float3          AmbientColor;
    int             _pad2;
};

struct MaterialParam {
    //  we don't use Emissive
    //  Ambient and Diffuse come from glColor()
    float3          SpecularColor;
    float           SpecularExponent;
};

cbuffer FrameStateV : register(b0)
{
    matrix          ViewProjection;
    float3          EyePosV;
    float           FogNear;
    float           FogFar;
};

cbuffer FrameStateP : register(b0)
{
    float4          FogColor;
    float3          EyePosP;
}

struct TCMat
{
    float4          U;
    float4          V;
};

cbuffer MaterialStateV : register(b1)
{
    matrix          World;
    TCMat           TexCoordTransform[1];
    bool            TexTransformEnable0;
    bool            NormalInvertingEnable;
};

cbuffer MaterialStateP : register(b1)
{
    MaterialParam   Material;
    bool            AlphaTestEnable;
    float			AlphaTestValue;
};

cbuffer LightStateP : register(b2)
{
    float3          SceneAmbient;
    int             NumLightsEnabled;
    LightParam      Light[8];
};

Texture2D       FirstTexture;

SamplerState    FirstSampler;


struct VertexShaderInputUnlit {
    float4 P        : POSITION0;
    float2 UV       : TEXCOORD0;
    float4 C        : COLOR0;
};

struct VertexShaderOutputUnlit {
    float4 hPos     : SV_POSITION;
    float2 UV0      : TEXCOORD0;
    float  F        : TEXCOORD2;
    float4 C        : COLOR0;
};

struct PixelShaderInputUnlit {
    float4 hPos     : SV_POSITION;
    float2 UV0      : TEXCOORD0;
    float  F        : TEXCOORD2;
    float4 C        : COLOR0;
};


struct VertexShaderInputLit {
    float3 N        : NORMAL0;
};

struct VertexShaderOutputLit {
    float3 wPos     : TEXCOORD3;
    float3 N        : TEXCOORD4;
};

struct PixelShaderInputLit {
    float3 wPos     : TEXCOORD3;
    float3 N        : TEXCOORD4;
};


void unlit_transform(VertexShaderInputUnlit iUnlit, out VertexShaderOutputUnlit oUnlit, out VertexShaderOutputLit oLit)
{
    oLit.N = float3(1, 0, 0);
    oLit.wPos = mul(World, iUnlit.P).xyz;
    oUnlit.hPos = mul(ViewProjection, float4(oLit.wPos, 1));
    oUnlit.F = (length(oLit.wPos - EyePosV) - FogNear)
        / (FogFar - FogNear);
    if (TexTransformEnable0)
    {
        oUnlit.UV0.x = dot(float4(iUnlit.UV, 0, 1), TexCoordTransform[0].U);
        oUnlit.UV0.y = dot(float4(iUnlit.UV, 0, 1), TexCoordTransform[0].V);
    }
    else
    {
        oUnlit.UV0 = iUnlit.UV;
    }
    oUnlit.C = iUnlit.C;
}

void lit_transform(VertexShaderInputUnlit iUnlit, VertexShaderInputLit iLit, 
    out float3 oLitN)
{
    float nScale = NormalInvertingEnable ? -1 : 1;
    oLitN = mul((float3x3)World, iLit.N) * nScale;
}

void ShadeAVertexUnlit(VertexShaderInputUnlit iUnlit, out VertexShaderOutputUnlit oUnlit)
{
    VertexShaderOutputLit oLit;
    unlit_transform(iUnlit, oUnlit, oLit);
}

void ShadeAVertexLit(VertexShaderInputUnlit iUnlit, VertexShaderInputLit iLit, out VertexShaderOutputUnlit oUnlit, out VertexShaderOutputLit oLit)
{
    unlit_transform(iUnlit, oUnlit, oLit);
    lit_transform(iUnlit, iLit, oLit.N);
}

float4 read_texture(PixelShaderInputUnlit iUnlit)
{
    float4 tColor = FirstTexture.Sample(FirstSampler, iUnlit.UV0);
    return tColor;
}

float4 apply_fog(PixelShaderInputUnlit iUnlit, float4 cColor)
{
    return float4(lerp(cColor.xyz, FogColor.xyz, saturate(iUnlit.F)), cColor.w);
}

float3 calc_one_ad_light(LightParam param, float3 N, float3 wPos)
{
    //  infinite or omni light depends on the w being 0 or 1
    float3 lDir = normalize(param.Position.xyz - wPos * param.Position.w);
    float NdotL = saturate(dot(N, lDir));
    //  our lights have no falloff (for better or for worse...)
    return param.AmbientColor + param.DiffuseColor * NdotL;
}

float3 calculate_ad_light(PixelShaderInputLit iLit)
{
    float3 val = SceneAmbient;
    float3 N = normalize(iLit.N);
    [loop]
    for (int i = 0; i < NumLightsEnabled; ++i)
    {
        val += calc_one_ad_light(Light[i], N, iLit.wPos);
    }
    return val;
}

float3 calc_one_s_light(LightParam param, float3 N, float3 E, float3 wPos)
{
    //  infinite or omni light depends on the w being 0 or 1
    float3 lDir = normalize(param.Position.xyz - wPos * param.Position.w);
    float3 H = normalize(lDir + E);
    float NdotH = saturate(dot(N, H));
    return param.SpecularColor * pow(NdotH, Material.SpecularExponent);
}

float3 calculate_s_light(PixelShaderInputLit iLit)
{
    float3 val = 0;
    float3 N = normalize(iLit.N);
    float3 E = normalize(iLit.wPos - EyePosP);
    [loop]
    for (int i = 0; i < NumLightsEnabled; ++i)
    {
        val += calc_one_s_light(Light[i], N, E, iLit.wPos);
    }
    return val;
}

float4 ShadeAPixelUnlit(PixelShaderInputUnlit iUnlit) : SV_TARGET
{
    float4 tColor = read_texture(iUnlit);
    float4 cColor = tColor * iUnlit.C;
    [branch]
    if (AlphaTestEnable)
    {
        clip(cColor.w - AlphaTestValue);
    }
    return apply_fog(iUnlit, cColor);
}

float4 ShadeAPixelLit(PixelShaderInputUnlit iUnlit, PixelShaderInputLit iLit) : SV_TARGET
{
    float4 tColor = read_texture(iUnlit);
    float4 cColor = tColor * iUnlit.C;
    [branch]
    if (AlphaTestEnable)
    {
        clip(cColor.w - AlphaTestValue);
    }
    float3 adLight = calculate_ad_light(iLit);
    // todo: it seems we're not using specular, so don't pay for it!
    float3 sLight = float3(0, 0, 0); //calculate_s_light(iLit);
    cColor = float4((cColor.xyz * adLight) + sLight * Material.SpecularColor, cColor.w);
    return apply_fog(iUnlit, cColor);
}


/*
technique10 RenderUnlit
{
    pass P0
    {
        SetVertexShader(CompileShader(vs_4_0, ShadeAVertexUnlit()));
        SetPixelShader(CompileShader(ps_4_0, ShadeAPixelUnlit()));
    }
}

technique10 RenderLit
{
    pass P0
    {
        SetVertexShader(CompileShader(vs_4_0, ShadeAVertexLit()));
        SetPixelShader(CompileShader(ps_4_0, ShadeAPixelLit()));
    }
}
*/
