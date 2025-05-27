# Define URL and destination
url = "https://raw.githubusercontent.com/QFCatMSU/GGPlot-Class-Material/refs/heads/master/assets/_AppInstructions.qmd";
dest = "_assets/_AppInstructions.qmd";

# Create the folder if it doesn't exist
if (!dir.exists("_assets")) 
  dir.create("_assets");

# Download the file
download.file(url, dest, mode = "wb");