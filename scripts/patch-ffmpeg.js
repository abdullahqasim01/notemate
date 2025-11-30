const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@palashakhenia',
  'ffmpeg-kit-react-native-sf',
  'android',
  'build.gradle'
);

console.log('Patching ffmpeg-kit build.gradle for release builds...');

if (!fs.existsSync(buildGradlePath)) {
  console.error('build.gradle not found at:', buildGradlePath);
  process.exit(1);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');

// Replace the local .aar dependency with a flatDir repository approach
const oldDependency = 'implementation fileTree(include: [\'*.jar\', \'*.aar\'], dir: \'libs\')';
const newDependency = `// Patched to avoid AAR bundling issues in release builds
  // implementation fileTree(include: ['*.jar', '*.aar'], dir: 'libs')
  implementation(name: 'ffmpeg-kit-https-6.0-2', ext: 'aar')`;

if (content.includes(oldDependency)) {
  content = content.replace(oldDependency, newDependency);
  
  // Add flatDir repository for the .aar file
  const repositoriesBlockEnd = 'dependencies {';
  if (content.includes(repositoriesBlockEnd)) {
    const insertion = `
repositories {
  flatDir {
    dirs 'libs'
  }
}

`;
    content = content.replace(repositoriesBlockEnd, insertion + repositoriesBlockEnd);
  }
  
  fs.writeFileSync(buildGradlePath, content, 'utf8');
  console.log('✓ Successfully patched ffmpeg-kit build.gradle');
} else {
  console.log('✓ build.gradle already patched or has different format');
}
