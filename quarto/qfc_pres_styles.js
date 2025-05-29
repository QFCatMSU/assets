document.addEventListener('DOMContentLoaded', function() 
{
  subtitle = document.querySelector("p.subtitle");
  
  if(subtitle)
  {
    // switch styles to css
    // remove from print mode
    protocol = window.location.protocol;
    host = window.location.hostname;
    path = window.location.pathname;
    
    // Replace .html with .pdf (only at end)
    let path_pdf = path.replace(/\.html$/, '.pdf');
    
    url_pdf = protocol + "//" + host + path_pdf;
    
    fetch(path_pdf).then((response) => 
    {
		  if (response.ok) 
		  {
			  subtitle.innerHTML += "<br><a style='font-size: 20px;' class='pdfLink' href='" + path_pdf + "' target='new'>Click here for the PDF version</a>";
		  } 
    })
  }
})