rm(list=ls());   

#### Get folders
qmd_dir = "_RStudioProjSetup"  # folder containing .qmd files
images_dir = file.path(qmd_dir, "images");          # folder containing images
unused_dir = file.path(images_dir, "unused_images") # where to move unused images

#### Create unused directory if it doesn’t exist
if (!dir.exists(unused_dir)) 
{
  dir.create(unused_dir)
}

#### Find all QMD scripts 
qmd_files = list.files(qmd_dir, pattern = "\\.qmd$", full.names = TRUE)

#### Extract image names from qmd files
# [_A-Za-z0-9]: starts with underscore or alphanumeric character
# [A-Za-z0-9._%()+-]*: contains any of these characters inside the filename
# \\. dot (needs to be escaped)
# ?: does not create a separate cature group for the extension
# (?![A-Za-z0-9]): no alphanumeric character right after extension (all other characters fine)
img_pattern <- "\\b([_A-Za-z0-9][A-Za-z0-9._%()+-]*\\.(?:jpe?g|png|gif|bmp|webp|svg|tiff?|heic|avif|ico))"

## Vector to hold all image references in the qmd files
used_images = c()

for (i in 1:length(qmd_files)) 
{
  lines = readLines(qmd_files[i], warn = FALSE)
  matched_lines = gregexpr(img_pattern, lines, ignore.case = TRUE)
  filenames = regmatches(lines, matched_lines)
  filenames_delist = unlist(filenames)
  if (length(filenames_delist) > 0)
  {
    used_images = c(used_images, filenames_delist) 
  }
}

### Make all names lowercase, 
used_images = unique(tolower(used_images)) # normalize for case

#### Get all images in the folder
all_images = list.files(images_dir, pattern = "\\.(png|jpg|jpeg|gif|bmp|tiff)$", 
                         ignore.case = TRUE)

#### Make all names lowercase
all_images_lower = tolower(all_images)

# Find unused images ---
unused_images = all_images[!(all_images_lower %in% used_images)]

# --- STEP 5: Move unused images ---
for (img in unused_images) 
{
  from = file.path(images_dir, img)
  to = file.path(unused_dir, img)
  file.rename(from, to)
}
