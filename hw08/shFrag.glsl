#version 300 es

precision highp float;

in vec3 fragPos;  
in vec3 normal;         // Phong shading
in vec2 texCoord;
out vec4 FragColor;

struct Material {
    vec3 diffuse;       // surface's diffuse color
    vec3 specular;      // surface's specular color
    float shininess;    // specular shininess
};

struct Light {
    vec3 direction; // new field
    vec3 ambient; // ambient 적용 strength
    vec3 diffuse; // diffuse 적용 strength
    vec3 specular; // specular 적용 strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform int u_toonLevels;

void main() {
    // ambient
    vec3 rgb = material.diffuse;
    vec3 ambient = light.ambient * rgb;
  	

    // diffuse
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);

    float toonLevels = float(u_toonLevels);
    diff = (float(floor(diff * toonLevels)) + 0.5) * (1.0 / toonLevels);
    vec3 diffuse = light.diffuse * diff * rgb;
    

    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);  // lightDir 부호 변경 주의의
    float spec = 0.0;
    if (dotNormLight > 0.0) {
        spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    }
    vec3 specular = light.specular * spec * material.specular;  
    
    specular = vec3(
        (float(floor(specular[0] * toonLevels)) + 0.5) * (1.0 / toonLevels),
        (float(floor(specular[1] * toonLevels)) + 0.5) * (1.0 / toonLevels),
        (float(floor(specular[2] * toonLevels)) + 0.5) * (1.0 / toonLevels)
    );


    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}