#  To-do
#    - test if this works in MAc and Linux
#    - color changes do not seem to be working in light mode
#    - delete old changes before adding new changes
#    - put injection at end of CSS?  Makes it more likely to be executed without !important

# Define file paths
url <- "https://raw.githubusercontent.com/QFCatMSU/assets/refs/heads/main/quarto/css_inject.css"

# Base Positron extensions directory (works for any Windows user)
# base_dir <- file.path(Sys.getenv("USERPROFILE"),
#                       ".positron", "extensions")

if (.Platform$OS.type == "windows") 
{
  home_root <- Sys.getenv("USERPROFILE")
}else
{
  home_root <- path.expand("~")
}

base_dir <- file.path(home_root, ".positron", "extensions")

# Find the installed Quarto extension directory
quarto_dir <- list.dirs(base_dir,
                        recursive = FALSE,
                        full.names = TRUE)

quarto_dir <- quarto_dir[
  grepl("^quarto\\.quarto-", basename(quarto_dir))
]

quarto_dir = quarto_dir[length(quarto_dir)]

target_file = paste0(quarto_dir, "/assets/www/editor/style.css")

# Read contents
text_prepend <- readLines(url, warn = FALSE)
inject_msg = "/* Injected by Inject_CSS_Quarto.R */"
text_prepend2 = c(inject_msg, text_prepend)

# Message to add at end of injection
text_target  <- readLines(target_file, warn = FALSE)

# Find if the inject_msg already exists
inject_msg_exists = which(text_target == inject_msg)

# Get last line with inject_msg (should only be one, but...)
if(length(inject_msg_exists) > 0)
{
  inject_line = inject_msg_exists[1]
  
  # delete lines in text_target until (and including) the inject msg
  text_target = text_target[1:(inject_line-1)]
}

# Combine (prepend first file to beginning of second)
combined_text <- c(text_target, text_prepend2)

# Write back to target file
writeLines(combined_text, target_file)
