import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const data = await request.json();
    const { photo, email } = data;

    // Remove the data:image/jpeg;base64 prefix to get just the image data
    const base64Data = photo.replace(/^data:image\/jpeg;base64,/, '');
    
    // Create a unique filename
    const filename = `photo-${Date.now()}.jpg`;
    
    // Set up the directory path
    const publicDir = path.join(process.cwd(), 'public', 'photos');
    
    try {
      // Try to create the directory if it doesn't exist
      await mkdir(publicDir, { recursive: true });
    } catch (err) {
      // Ignore error if directory already exists
      if (err.code !== 'EEXIST') throw err;
    }

    // Save the file
    const filePath = path.join(publicDir, filename);
    await writeFile(filePath, Buffer.from(base64Data, 'base64'));

    console.log('Photo saved:', filename);

    return NextResponse.json({ 
      success: true, 
      message: 'Photo saved successfully',
      filename: filename
    });

  } catch (error) {
    console.error('Error saving photo:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save photo' },
      { status: 500 }
    );
  }
}
