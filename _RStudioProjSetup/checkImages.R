rm(list=ls());   

#######
# The script will go through all the images in a folder and compare their names to 
# a list of all images referenced in qmd files from a folder.  Any image not
# referenced will be moved to a folder named unused_images
#
# To-do:
# - improve the image pattern
#   - not sure \\b is needed
#   - what is the purpose of the grouping ()
####

#### Get folders
qmd_dir = "_RStudioProjSetup"  # folder containing .qmd files
images_dir = file.path(qmd_dir, "images");          # folder containing images
unused_dir = file.path(images_dir, "unused_images") # where to move unused images

#### Find all QMD scripts 
qmd_files = list.files(qmd_dir, pattern = "\\.qmd$", full.names = TRUE)

#### Extract image names from qmd files
# \\b: word boundary (a word character is preceded by a non-word character)
#      -- this probably should be removed
# [_A-Za-z0-9]: starts with underscore or alphanumeric character
# [A-Za-z0-9._%()+-]*: contains any of these characters inside the filename
# \\. dot (needs to be escaped)
# ?: does not create a separate capture group for the extension
# (?![A-Za-z0-9]): no alphanumeric character right after extension (all other characters fine)
img_pattern <- "\\b([_A-Za-z0-9][A-Za-z0-9._%()+-]*\\.(?:jpe?g|png|gif|bmp|webp|svg|tiff?|heic|avif|ico))"

## Vector to hold all image references in the qmd files
used_images = c()

for (i in 1:length(qmd_files)) 
{
  ### read in all lines from the file 
  lines = readLines(qmd_files[i], warn = FALSE)
  ### find lines that match the image pattern
  matched_lines = gregexpr(img_pattern, lines, ignore.case = TRUE)
  ### extract filename from pattern
  filenames = regmatches(lines, matched_lines)
  ### unlist the filenames
  filenames_delist = unlist(filenames)
  ### add filenames to the running list
  if (length(filenames_delist) > 0)
    used_images = c(used_images, filenames_delist) 
}

### Make all names lowercase, only keep unique filenames 
used_images = unique(tolower(used_images)) 

#### Get all images in the folder
all_images = list.files(images_dir, 
                        pattern = "\\.(png|jpg|jpeg|gif|bmp|tiff)$", 
                        ignore.case = TRUE)

#### Make all names lowercase
all_images_lower = tolower(all_images)

# Find unused images
unused_images_index = which(!(all_images_lower %in% used_images))
unused_images = all_images[unused_images_index];

#### Create unused directory if it doesn’t exist and if there are unused_images
if (!dir.exists(unused_dir) && length(unused_images) > 0) 
{
  dir.create(unused_dir)
}

#### Move unused images 
## Commented because this is the only dangerous part of the script
for (i in seq_along(unused_images))   # handle no images properly
{
  from = file.path(images_dir, unused_images[i])
  to = file.path(unused_dir, unused_images[i])
  file.rename(from, to)
}
