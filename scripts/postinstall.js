const fs = require('fs');
const path = require('path');

console.log('Running postinstall script to patch ffmpeg-kit...');

// Path to the ffmpeg-kit build.gradle file
const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@palashakhenia',
  'ffmpeg-kit-react-native-sf',
  'android',
  'build.gradle'
);

// Path to the project-level build.gradle
const projectBuildGradlePath = path.join(
  __dirname,
  '..',
  'android',
  'build.gradle'
);

if (!fs.existsSync(buildGradlePath)) {
  console.error('ERROR: ffmpeg-kit build.gradle not found at:', buildGradlePath);
  process.exit(0); // Don't fail the install
}

try {
  // Patch 1: Update the project-level build.gradle to add flatDir for .aar files
  if (fs.existsSync(projectBuildGradlePath)) {
    let projectContent = fs.readFileSync(projectBuildGradlePath, 'utf8');
    
    const flatDirRepo = `    flatDir {
      dirs new File(rootDir, '../node_modules/@palashakhenia/ffmpeg-kit-react-native-sf/android/libs')
    }`;
    
    if (!projectContent.includes('flatDir')) {
      // Add flatDir after mavenCentral in allprojects
      projectContent = projectContent.replace(
        /allprojects\s*{\s*repositories\s*{\s*([\s\S]*?)(mavenCentral\(\))/m,
        `allprojects {\n  repositories {\n$1$2\n${flatDirRepo}`
      );
      fs.writeFileSync(projectBuildGradlePath, projectContent, 'utf8');
      console.log('✅ Added flatDir repository to android/build.gradle');
    } else {
      console.log('ℹ️  flatDir already exists in android/build.gradle');
    }
  }

  // Patch 2: Update ffmpeg-kit build.gradle to use proper dependency declaration
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Replace the fileTree implementation with proper .aar reference
  const oldPattern = /implementation fileTree\(include: \['\*\.jar', '\*\.aar'\], dir: 'libs'\)/;
  const newDependency = `implementation(name: 'ffmpeg-kit-https-6.0-2', ext: 'aar')
  implementation fileTree(include: ['*.jar'], dir: 'libs')`;

  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newDependency);
    fs.writeFileSync(buildGradlePath, content, 'utf8');
    console.log('✅ Successfully patched ffmpeg-kit build.gradle');
  } else {
    console.log('ℹ️  ffmpeg-kit build.gradle already patched');
  }
} catch (error) {
  console.error('Error patching ffmpeg-kit:', error.message);
  // Don't fail the install process
}
