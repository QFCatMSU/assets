###  To-do
#    - test if this works in MAc and Linux
#    - <done> color changes do not seem to be working in light mode
#    - <done> delete old changes before adding new changes
#    - <done> put injection at end of CSS?  Makes it more likely to be executed without !important

### Generic path of quarto css:
# ~\.positron\extensions\quarto.quarto-1.###.#\assets\www\editor\style.css

# File path to injected CSS code
inject_css = "https://raw.githubusercontent.com/QFCatMSU/assets/refs/heads/main/quarto/css_inject.css"

## Get the Home folder for the user (different for Windows)
if (.Platform$OS.type == "windows") 
{
  home_folder = Sys.getenv("USERPROFILE")
}else
{
  home_folder = path.expand("~")
}

## <home_folder>/.positron/extensions
ext_dir = file.path(home_folder, ".positron", "extensions")

# List all directories in the extensions folder 
all_dir = list.dirs(ext_dir, recursive = FALSE, full.names = FALSE)

# Find the index of all the folder that begin with quarto
quarto_index = grep(all_dir, pattern="^quarto\\.quarto");

# Use the last quarto folder (if more than 1) -- this is the latest version
quarto_dir = all_dir[quarto_index[length(quarto_index)]]

## Use the last quarto directory if more than 1 installation
# quarto_dir = quarto_dir[length(quarto_dir)]

# <home_folder>/.positron/extensions/<quarto_dir>/assets/www/editor/style.css
target_file = paste0(ext_dir, "/", quarto_dir, "/assets/www/editor/style.css")

# Read CSS for inject file, insert a comment at the beginning 
text_prepend = readLines(inject_css, warn = FALSE)
inject_msg = "/* Injected by Inject_CSS_Quarto.R */"
text_prepend2 = c(inject_msg, text_prepend)

# Read in CSS from current quarto CSS file
text_target  = readLines(target_file, warn = FALSE)

# Find if the inject_msg already exists
inject_msg_exists = which(text_target == inject_msg)

# Get first line with inject_msg (should only be one, but...)
if(length(inject_msg_exists) > 0)
{
  inject_line = inject_msg_exists[1]
  
  # delete lines in text_target from inject msg to the end
  text_target = text_target[1:(inject_line-1)]
}

# Combine original CSS with injected CSS
combined_css = c(text_target, text_prepend2)

# Write back to target file
writeLines(combined_css, target_file)
