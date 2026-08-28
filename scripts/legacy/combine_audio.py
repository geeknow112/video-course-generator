import sys
import wave
import os

def combine_wav_files(output_path, input_files):
    """Combine multiple WAV files into one."""
    data = []
    params = None
    
    for wav_file in input_files:
        with wave.open(wav_file, 'rb') as w:
            if params is None:
                params = w.getparams()
            data.append(w.readframes(w.getnframes()))
    
    with wave.open(output_path, 'wb') as output:
        output.setparams(params)
        for d in data:
            output.writeframes(d)
    
    print(f"Combined {len(input_files)} files into {output_path}")

if __name__ == "__main__":
    audio_dir = r"c:\Users\youre\Documents\git_repo\video-course-generator\audio\6-4"
    files = [
        os.path.join(audio_dir, "6-4_page01.wav"),
        os.path.join(audio_dir, "6-4_page02.wav"),
        os.path.join(audio_dir, "6-4_page03.wav"),
        os.path.join(audio_dir, "6-4_page04.wav"),
        os.path.join(audio_dir, "6-4_page05.wav"),
        os.path.join(audio_dir, "6-4_page06.wav"),
    ]
    output = os.path.join(audio_dir, "6-4_combined.wav")
    combine_wav_files(output, files)
