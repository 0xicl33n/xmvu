varying vec2 uv_coord; 
varying vec3 normal;
varying vec4 v_color;
varying vec4 world_position;

uniform sampler2D stage0;
uniform sampler2D stage1;

uniform int enabledTextures;
uniform int enabledLights;
uniform int enabledVertexColors;
uniform int enabledFog;

void main() {
	vec4 lighting = vec4(1, 1, 1, 1);
	vec4 vertex_color = vec4(1, 1, 1, 1);
	if(enabledVertexColors > 0)
	{
		vertex_color = v_color;
	}
	
	if(enabledLights > 0)
	{
		lighting = gl_LightModel.ambient * vertex_color;
		for(int i = 0; i < gl_MaxLights; i++)
		{
			vec4 d = gl_LightSource[i].diffuse;
			vec4 lp = gl_LightSource[i].position;
			float ndotl = 0.0;
			if(lp.w > 0.0)
			{
				ndotl = max(0.0, dot(normalize(lp.xyz - world_position.xyz), normal));
			}
			else
			{
				ndotl = max(0.0, dot(normal, normalize(lp.xyz)));
			}
			lighting += d * ndotl * 0.8;//dirty hack
		}
	}
	
	vec4 co = texture2D(stage0, uv_coord);
	if(enabledTextures > 1)
	{
		vec4 c1 = texture2D(stage1, uv_coord);
		co = vec4(mix( co.rgb, c1.rgb, c1.a ), c1.a); 
 	}
 	
 	co = clamp(vec4(co.rgb * vertex_color.rgb * lighting.rgb, co.a), 0.0, 1.0);

	if(enabledFog > 0)
	{
		float fogfactor = (gl_Fog.end - abs(world_position.z)) * gl_Fog.scale;
		fogfactor = clamp(fogfactor, 0.0, 1.0);
		co = vec4(mix(gl_Fog.color.rgb, co.rgb, fogfactor), co.a); 
	}

    gl_FragColor = co;
}
