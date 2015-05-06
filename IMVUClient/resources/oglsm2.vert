varying vec2 uv_coord; 
varying vec3 normal;
varying vec4 v_color;
varying vec4 world_position;


uniform int enabledVertexColors;

void    main() {
    //view and projection transform
    vec4 P = gl_Vertex;
    
	v_color = vec4(1,1,1,1);
    if(enabledVertexColors > 0)
	{
		v_color = gl_Color;
	}
	normal = normalize(gl_NormalMatrix * gl_Normal);
    uv_coord = (gl_TextureMatrix[0] * vec4(gl_MultiTexCoord0.xy, 0, 1)).xy;
  	world_position = gl_ModelViewMatrix * P;
  
    gl_Position = gl_ModelViewProjectionMatrix * P;
}
