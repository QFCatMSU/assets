/***** To-do ******
- Have shortcut menu disable drag event
- <done> image sizing compares images current size to full screen,
  as opposed to actual screen size
- implement a "Return to Previous location" button that
  goes away when scrolling occurs
- make sure a page break does not break up a codeblock with a codeblock tab
****************/

smallImageWidth = 150;			// set the height of flex-sized objects when small 
scrollTopPosition = 0; 			// value saved for links-return-links within a page
referenceTimer = "";				// timer used to toggle the reference object
scrollFlag = 0;  						// counts when scrolling of page occurs due to reference links

/*** Handling the long-press menu ****/
longClickTimer = null;
overRCMenu = false;
// keep mouse positions in global memory because they can only be captured on mouse events
mouseX = mouseX2 = mouseY = mouseY2 = 0; 

clickMode = null;
fsClick = null;
origWidth = null;

// Initialize custom Quarto page behavior after the window finishes loading.
window.addEventListener("load", function()
{		

	encapObject = document.body; 
	scrollTopPosition = window.parent.scrollY;  
  
   // add a print button to the title line
	titleObj = encapObject.querySelector(".title");
	
	if(titleObj)  // there is a title 
	{
		// create printer icon 
		printLink = document.createElement('a');
		printLink.classList.add("self");
		printLink.target = "_self";
		printLink.href = "javascript:window.print();"
		printLink.style.marginLeft = "9px";
		printLink.innerHTML = "&#9113";
		
		// stop Quarto from removing the primary header
		titleObj.classList.remove("d-none");
    
		// add printer icon to title
		titleObj.appendChild(printLink);
	}
	
	// Highlight portions of code enclosed in « and ».
	// When mod is true, process all code blocks;
	// otherwise, process only code blocks with class="mod".

	let codeBlocks;

	if(typeof mod !== "undefined" && mod == true)
	{
		codeBlocks = document.querySelectorAll("pre");
	}
	else
	{
		codeBlocks = document.querySelectorAll("pre.mod");
	}

	for(let i = 0; i < codeBlocks.length; i++)
	{
		let newHTML = codeBlocks[i].innerHTML;
		newHTML = newHTML.replace(/«/g, "<b>");
		newHTML = newHTML.replace(/»/g, "</b>");
		codeBlocks[i].innerHTML = newHTML;
	}
	
	// Add a label above code blocks with a data-tab attribute.
	const codeBlockDivs = document.querySelectorAll("[data-tab]");

	for(let i = 0; i < codeBlockDivs.length; i++)
	{
		const tabSpan = document.createElement("span");
		const tabText = codeBlockDivs[i].getAttribute("data-tab");

		tabSpan.classList.add("codeBlockTab", "noSelect", "noCode", "nonum");
		tabSpan.setAttribute("data-text", tabText);
		tabSpan.innerText = tabText;

		codeBlockDivs[i].parentElement.insertBefore(tabSpan, codeBlockDivs[i]);
		codeBlockDivs[i].classList.add("hasTab");
	}
  
	// allow users to resize images from small to full-size
	createFlexImages();
	
	// reposition table of contents and sidebar in quarto
  format_TOC_Sidebar();
	
	// Create a right-click menu
	makeContextMenu();  // needs to happen after divs are created
		
	// check the URL to see if there is a request to go to a specific part of the page
	checkURLForPos();
	
	// target most hyperlinks to a new window
	linksToNewWindow();
	
	// if this page was hyperlinked from elsewhere and a hash tag was added to the link
	if(window.location.hash.slice(1) != "") 
		scrollToElement(window.location.hash.slice(1), true);
});

// code to add lesson name to table
document.addEventListener("DOMContentLoaded", function() 
{
  const titleEl = document.querySelector("h1.title");     // Quarto adds this class
  const tocTitleEl = document.querySelector("h2#toc-title"); // TOC heading
  if (titleEl && tocTitleEl) 
  {
    const lessonTitle = titleEl.innerText.trim();
    tocTitleEl.innerHTML = "<b>" + lessonTitle + "</b>";
  }
}); 
  
window.addEventListener("mousedown", function(event)
{
	// make sure it's a left-click and the MathJax Frame is not showing
	if(event.which == 1 && !document.querySelector("#MathJax_MenuFrame"))
	{
		clickMode = "click";
		// keep track of mouse position during timer
		window.addEventListener("mousemove", getMousePos);	
		
		// get current position of mouse -- save to start and final position
		mouseX = mouseX2 = parseInt(event.clientX);
		mouseY = mouseY2 = parseInt(event.clientY);
		
		longClickTimer = setTimeout(function() 
		{
			// not over a dragable object
			if(fsClick == null)
			{
				window.removeEventListener("mousemove", getMousePos);	
			}
			// bring up shortcut menu if mouse has barely moved
			if(Math.abs(mouseX2-mouseX) < 10 &&  Math.abs(mouseY2-mouseY) < 10 && clickMode == "click")
			{
				activateElement(event, encapObject.querySelector("#longClickMenu"));
				overRCMenu = true;
				clickMode = "menu";
				window.removeEventListener("mousemove", getMousePos);		
				encapObject.style.userSelect = "none";
				encapObject.style.msUserSelect = "none";
			}
	  }, 350);
	}
});

// disable short-cut menu on scroll (mousemoves are not triggered on scroll)
window.addEventListener("scroll", function(event)
{ 
	clearTimeout(longClickTimer);
});
	
window.addEventListener("mouseup", function()
{
	cleanupFlexEvent();

	//	tried to avoid this with stopPropogation -- that did not work
	if(!overRCMenu)
	{
		encapObject.querySelector("#longClickMenu").style.visibility = "hidden";
		encapObject.querySelector("#longClickMenu").style.top = "0px";
		encapObject.style.userSelect = "";
		encapObject.style.msUserSelect = "";
	}
});

// will combine the following two functions later...
function activateNotification(e)
{
	// create a notification layer is there is not one
	if(!encapObject.querySelector("#notification"))
	{
		// create a new notification layer
		notifDiv = document.createElement("div");
		notifDiv.id = "notification";
		notifDiv.classList.add("rcMenu"); // use same style as menu
		encapObject.appendChild(notifDiv);
	}
	else
	{
		clearInterval(notifTimer);  // make sure the timer is not running
	}
	
	// Display a notification after scrolling to a referenced element.
	notifDiv.innerHTML = "Hold left mouse button to return to previous location";
	const displayTime = 2000;
	
	if(e && typeof e.clientX === "number" && typeof e.clientY === "number")
	{
		// Position the notification near the mouse pointer.
		activateElement(e, notifDiv, -2);
	}
	else
	{
		// No mouse event: position the notification near the top-right
		// corner of the visible browser window.
		notifDiv.style.left = (window.scrollX + window.innerWidth - 350) + "px";
		notifDiv.style.top = (window.scrollY + 20) + "px";
		notifDiv.style.visibility = "visible";
	}

	// set timer for notfication layer
	notifTimer = setTimeout(function()
	{
		notifDiv.style.visibility = 'hidden';
		notifDiv.style.top = '0px';
	}, displayTime);
}

// Position the long-click menu or a notification near the mouse pointer.
function activateElement(e, element, offset = 5)
{			
	rcMenuDim = element.getBoundingClientRect();
	
	if(window.innerWidth - e.clientX < rcMenuDim.width)  
	{
		element.style.left = (window.scrollX + e.clientX - rcMenuDim.width + offset) + "px";
	}
	else
	{
		element.style.left = (window.scrollX + e.clientX - offset) + "px";
	}
	
	// Position the element above the pointer if there is insufficient
	// room below it in the browser window.
	if(window.innerHeight - e.clientY < rcMenuDim.height)	
	{
		element.style.top = (window.scrollY + e.clientY - rcMenuDim.height + offset) + "px";
	}
	else
	{
		element.style.top = (window.scrollY + e.clientY - offset) + "px";
	}
	
	element.style.visibility = "visible"; 
}

/*
Find all images within the page that have the "flexSize" class
and add click events that give the user the ability to change 
the size of the image.  Called on page load.
*/
function createFlexImages()
{
	// find all images that have the class name "flexSize" or "fs"
	var flexVideo = encapObject.querySelectorAll('video.flexSize, video.fs');
	var flexIframe = encapObject.querySelectorAll("div.fs iframe, p.fs > iframe, p.flexsize > iframe");
  
  // find all figures within a fs div -- in Quarto these are plots from embedded scripts
  quartoFS = document.querySelectorAll("div.fs img.figure-img");
  for(let i=0; i<quartoFS.length; i++)
  {
    // add fs directly to the image
    quartoFS[i].classList.add("fs");
  }
  
	// find all flexsized images
	fsObj = document.querySelectorAll("img.fs");

	// for each flexsized image
	for(let i=0; i<fsObj.length; i++)
	{	
		// mousedown: set the flexsized object
		fsObj[i].addEventListener("mousedown", function(event)
		{
			if(event.which == 1)
			{		
				fsClick = fsObj[i];
				fsClick.style.cursor = "ew-resize";
				fsClick.ondragstart = function() {return false;};
			}
		});
		fsObj[i].addEventListener("mouseup", function(event)
		{
			if(event.which == 1)
			{	
				if(clickMode == "click")
				{
					changeImageSize(this)
				}
			}
		});
		// end whatever you are doing if mouse leaves the object
		fsObj[i].addEventListener("mouseout", function(event)
		{	
			cleanupFlexEvent()
		});
		fsObj[i].addEventListener("click", function(event)
		{
		});
		fsObj[i].addEventListener("dragstart", function(event)
		{
			//event.preventDefault();
		});
		fsObj[i].addEventListener("dragend", function(event)
		{
			//event.preventDefault();
		});
		//initialize image to small size
		changeImageSize(fsObj[i], "minimize");
	}
	
	// go through all the videos...
	for(let i=0; i<flexVideo.length; i++)	// for each flexSize element
	{
		let videoHeight = flexVideo[i].height;
		let videoWidth = flexVideo[i].width;
		flexVideo[i].height = smallImageWidth *  videoHeight/ videoWidth;
		flexVideo[i].width = smallImageWidth;
		flexVideo[i].addEventListener("play", 
			function()
			{
				this.width=videoWidth; 
				this.height=videoHeight;
			});
		flexVideo[i].addEventListener("ended", 
			function()
			{
				this.height=smallImageWidth * videoHeight / videoWidth;
				this.width=smallImageWidth;
			});
	}
		
	for(let i=0; i<flexIframe.length; i++)
	{
		let iframeHeight = flexIframe[i].height; 
		let iframeWidth = flexIframe[i].width; 
		flexIframe[i].height = smallImageWidth *  iframeHeight / iframeWidth;
		flexIframe[i].width = smallImageWidth;

		// create a small span button 
		resizeButton = document.createElement("span");
		resizeButton.classList.add("flexButton");
		resizeButton.classList.add("noSelect");
		resizeButton.innerText = "\u{1f846}";
		resizeButton.addEventListener("click", 
			function()
			{
				if(flexIframe[i].width != iframeWidth)
				{
					flexIframe[i].width = iframeWidth; 
					flexIframe[i].height = iframeHeight; 
					flexIframe[i].src = flexIframe[i].src;
					this.innerText = "\u{1f844}";
				}
				else
				{
					flexIframe[i].height = smallImageWidth * iframeHeight / iframeWidth; 
					flexIframe[i].width = smallImageWidth;
					this.innerText = "\u{1f846}";
				}
			});
		flexIframe[i].parentElement.appendChild(resizeButton);
	}
}

/*
function called when a flexSize image is clicked --
changes the size of images between small and large

possible instruction values: minimize and maximize
*/
function changeImageSize(element, instruction="none")
{
	if(instruction == "maximize")
	{
		element.style.width = element.naturalWidth + "px"; // "unset";
		element.style.cursor = "zoom-out";
	}
	else if (instruction == "minimize")
	{
		// set the images height to the smallHeight value and scale the width to match
		element.style.width = smallImageWidth + "px";	
		element.style.cursor = "zoom-in";
	}
	else if (instruction == "half")
	{
		element.style.width = ((smallImageWidth + element.naturalWidth) / 2) + "px";
		element.style.cursor = "zoom-in";
	}
	else // click directly on image
	{
	  // current width of image
		currentWidth = parseInt(element.clientWidth);
		// starting width of image
		naturalWidth = parseInt(element.naturalWidth);
		// width of parent frame (image cannot be bigger than this)
		parentWidth = parseInt(element.parentElement.clientWidth);
		
		if(naturalWidth >= parentWidth) 
		  naturalWidth = parentWidth
		
		if( (naturalWidth - currentWidth) < (currentWidth - smallImageWidth) ||
		    (naturalWidth < parseInt(element.width)))
		{
			element.style.width = smallImageWidth + "px";	
			element.style.cursor = "zoom-in";
		}
		else
		{
			element.style.width = element.naturalWidth + "px"; // "unset";
			element.style.cursor = "zoom-out";
		}
	}
}


/* call from right-click menu in page to either minimize or maximize (param)
	all the flex-sized images in the page */
function changeAllPicSize(param)
{
	/****
	Quarto will add class names to the div around the image 
	****/
	var flexImage = encapObject.querySelectorAll('img.flexSize, img.fs');
	for(i=0; i<flexImage.length; i++)
	{
		changeImageSize(flexImage[i], param);
	}
}

/* Linkback function */
function goBackToPrevLocation()
{
    const leftPos = window.scrollX;

    const prevLocLink = document.getElementById("previousLocMenuItem");
    prevLocLink.classList.add("disabledLink");

    const newScrollTopPosition = window.scrollY;

    // Return to the previous scroll position, while saving
    // the current position so the user can navigate back again.
    window.scrollTo(leftPos, scrollTopPosition);
    scrollTopPosition = newScrollTopPosition;
}



function goToTopOfPage()
{
    // Save the current position so the user can return to it.
    scrollTopPosition = window.scrollY;

    window.scrollTo(window.scrollX, 0);
    enablePrevious();
}

function makeContextMenu(funct, param = null)
{	
	var elemDiv = document.createElement('div');
	elemDiv.id = "longClickMenu";
	elemDiv.classList.add("rcMenu");
	elemDiv.addEventListener("mouseenter", function() {overRCMenu = true;}); 
	elemDiv.addEventListener("mouseleave", function() {overRCMenu = false;}); 
	
	var scTitle = document.createElement('a');
	elemDiv.innerHTML = "<b>Shortcut Menu</b>";
	elemDiv.style.display = "block";
	elemDiv.classList.add("sameWin", "noSelect");
	elemDiv.appendChild(scTitle);
	
	// create the menmu items
	menuLinks(elemDiv, "Return to previous location", goBackToPrevLocation, "previousLocMenuItem", false);
	menuLinks(elemDiv, "Go to Top of Page", goToTopOfPage, "topMenuItem");
	menuLinks(elemDiv, "Print/ Save as PDF", function(){document.getElementById("longClickMenu").style.visibility = "hidden"; window.print()}, "printToPDF");
	menuLinks(elemDiv, "Maximize All Images", function() {changeAllPicSize('maximize')}, "maxAllImages");
	menuLinks(elemDiv, "Minimize All Images", function() {changeAllPicSize('minimize')}, "minAllImages");
	menuLinks(elemDiv, "All Images 50%", function() {changeAllPicSize('half')}, "halfImages");
	
	encapObject.appendChild(elemDiv);
}

function menuLinks(menu, text, command, linkid="", enable=true)  
{
	// create a block span to encapsulate the hyperlink
	spanEncap = document.createElement('span');
	spanEncap.style.display = "block";
		
	link = document.createElement('a');
	if(!enable)
		link.classList.add("disabledLink");
	link.id = linkid;
	link.innerText = text;
	link.classList.add("sameWin", "jsLink");
	link.addEventListener("mouseup", 
								 function(event) 
								 { 
									command(); 	
									document.getElementById("longClickMenu").style.visibility = "hidden"; 
									document.getElementById("longClickMenu").style.top = "0px"; 
								 });
	spanEncap.appendChild(link);
	
	menu.appendChild(spanEncap);
}

function scrollToElementReturn(elementID)
{
	// this resolves the fact that variables are function scoped in JavaScript
	//   -- not block scoped
	return function() 
	{
		scrollToElement(elementID);	
	}
}

function checkURLForPos()
{
    // Scroll to an element specified by the URL's ref parameter.
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");

    if(ref != null)
    {
        scrollToElement(ref);
    }
}

function scrollToElement(elementID, outsideCall = false)
{		
	//	var element = encapObject.querySelector("#" + elementID); 
	var element = document.getElementById(elementID); 
	const windowHeight = window.innerHeight; // height of the webpage with the lesson
	const windowScroll = window.scrollY; 	 // amount window has been scrolled
	let divWindowScroll = 0;				 // for object in a scrolling div
	
	// check if the referenced element is a codeline in a div that has a scrollbar
	if(element.classList.contains("code")  &&   // part of a codeBlock
		 element.parentNode.scrollHeight > element.parentNode.clientHeight) // scrollbar on codeblock
	{
		// line is scrolled out of view
		if(element.offsetTop < element.parentNode.scrollTop || 
		   element.offsetTop > element.parentNode.scrollTop + element.parentNode.offsetHeight) 
		{
			element.parentNode.scrollTop = element.offsetTop - 20;  // scroll line back into view
		}
		divWindowScroll = element.parentNode.scrollTop;  // get the current scroll position
	}

	// Calculate the element's vertical position in the document.
	const elementYPos = element.getBoundingClientRect().top + window.scrollY; 
	
	// if the element is not on the screen
	if(elementYPos < windowScroll || elementYPos > (windowScroll+(2*windowHeight)))
	{
		// add some padding so the object does not appear right at the top of the page
		if(element.classList.contains("caption"))
		{
			offsetPadding = 200;	// add more padding if this is an image
		}
		else
		{
			offsetPadding = 50;
		}
		
		// save the current value of the scroll position so we can return to this spot
		scrollTopPosition = window.scrollY; 
		
		// scroll the parent to the vertical position of the linkTo element
		window.scrollTo(element.offsetLeft, (elementYPos -offsetPadding) );	
		
		scrollFlag = scrollFlag +1;
		if(scrollFlag <= 2) 
		{
    		activateNotification(null);
		}
		enablePrevious();
	}
	// if the scrolling-to element is within one page
	else if(elementYPos >  (windowScroll+windowHeight) && elementYPos < (windowScroll+ (2*windowHeight)))
	{
		offsetPadding = windowHeight - 200;
		
		// save the current value of the scroll position so we can return to this spot
		scrollTopPosition = window.scrollY; 
		
		// scroll the parent to the vertical position of the linkTo element
		window.scrollTo(element.offsetLeft, (elementYPos -offsetPadding) );	
		enablePrevious();
	}
	
	highLightObject(element);
}

function highLightObject(element, time=2000)
{
  // for headers 
  //refElement = document.querySelector("[data-anchor-id=" + element.id + "]");
  refElement = document.querySelector("[data-anchor-id='" + String(element.id) + "']");
  if(!refElement)
  {
    // for all but headers
    refElement = document.querySelector("#" + element.id);
  }
  
  // spans cannot have background color, so change element to parent of span
  if(refElement.tagName == "SPAN")
  {
    refElement = refElement.parentElement; 
  }
  			    
	// check if there already is an object being highlighted
	if(encapObject.querySelector(".refObjHighlight"))
	{
		encapObject.querySelector(".refObjHighlight").classList.remove("refObjHighlight");
		clearInterval(referenceTimer);
	}

	refElement.classList.add("refObjHighlight");
	referenceTimer = setTimeout(function() 
	{
		refElement.classList.remove("refObjHighlight");
	}, time);
}

function enablePrevious()
{	
	// change the right-click menu to show the return link
	prevLocLink = document.getElementById("previousLocMenuItem");
	prevLocLink.classList.remove("disabledLink");
}

function linksToNewWindow()
{
    const quartoContent = document.getElementById("quarto-content");

    if(quartoContent !== null)
    {
        const links = quartoContent.querySelectorAll('#TOC a[href], #quarto-document-content a[href]');

        for(let i=0; i<links.length; i++)
        {
            const linkUrl = new URL(links[i].href);

            // Download R and CSV files, or links explicitly marked for download
            if(linkUrl.pathname.endsWith(".R") || linkUrl.pathname.endsWith(".csv") ||
               links[i].classList.contains("dl") || links[i].classList.contains("download"))
            {
                links[i].setAttribute("download", "");
            }

            // Handle links to locations within the current page
            else if(linkUrl.origin == window.location.origin &&
                    linkUrl.pathname == window.location.pathname &&
                    linkUrl.search == window.location.search &&
                    linkUrl.hash != "")
            {
                const hashID = decodeURIComponent(linkUrl.hash.substring(1));

                links[i].classList.add("inpageLink");

                links[i].addEventListener("click", function(event)
                {
                    const element = document.getElementById(hashID);

                    if(element !== null)
                    {
                        event.preventDefault();
                        scrollToElement(element.id);
                    }
                });
            }

            // Links explicitly marked to open in the current window
            else if(links[i].classList.contains("self") ||
                    links[i].classList.contains("sameWin"))
            {
                links[i].target = "_self";
            }

            // Open other links in a new window, except Quarto cross-references
            else if(links[i].href.trim() != "" &&
                    !links[i].classList.contains("quarto-xref") &&
                    (links[i].target == "_self" || !links[i].target))
            {
                links[i].target = "_blank";
            }
        }
    }
}

// Track mouse movement for long-click detection and image resizing.
function getMousePos(event)
{
    mouseX2 = event.clientX;
    mouseY2 = event.clientY;

    // Start resizing when the mouse moves far enough.
    if(clickMode == "click" && fsClick != null && Math.abs(mouseX2 - mouseX) > 20)
    {
        clickMode = "drag";
        fsClick.classList.add("resizing");
        mouseX = mouseX2;
        origWidth = fsClick.clientWidth;
    }

    // Resize the image as the mouse moves.
    if(clickMode == "drag")
    {
        newWidth = origWidth + mouseX2 - mouseX;

        if(newWidth > 100)
        {
            fsClick.style.width = newWidth + "px";
        }
    }
}

function cleanupFlexEvent()
{
	clearTimeout(longClickTimer);
	window.removeEventListener("mousemove", getMousePos);	
		
	if(clickMode == "drag")
	{
	  // current width of image
		currentWidth = parseInt(fsClick.clientWidth);
		// starting width of image
		naturalWidth = parseInt(fsClick.naturalWidth);
		// width of parent frame (image cannot be bigger than this)
		parentWidth = parseInt(fsClick.parentElement.clientWidth);
		
		if( (naturalWidth - currentWidth) < (currentWidth - smallImageWidth) ||
	    (naturalWidth < parseInt(fsClick.width)))
		  fsClick.style.cursor = "zoom-out";
		else
			fsClick.style.cursor = "zoom-in";
			
		fsClick.classList.remove("resizing");
	}
	clickMode = null;	
	fsClick = null;
}

function format_TOC_Sidebar()
{
  // find table of contents
	toc = document.querySelector("nav.toc-active");

	// find sidebar
	sidebar = document.querySelector("div.sidebar-item-container");
	
	// if both sidebar and toc exists...
	if(sidebar !== null && toc !== null)
	{
		// move the toc before the sidebar
		sidebar.parentNode.insertBefore(toc, sidebar);
	}
	
	// find search bar
	searchBar = document.querySelector(".sidebar-search input");
	
	// this is supposed to be done in YAML but it does not work yet
	if (searchBar !== null)  
		searchBar.setAttribute("placeholder", "Search all lessons");
}

/* function has been deprecated by Quarto
function equationNumbering()
{
	// find all elements that are equation numbers
	var equations = encapObject.getElementsByClassName("eqNum");
	
	// add the equation number after the equation
	for(i=0; i<equations.length; i++)
	{
		if(equations[i].textContent.trim() != "")
		{		
			eqNumber = document.createElement("span");
			eqNumber.classList.add("eqNum");
			eqNumber.id = equations[i].id;
			
			eqNumber.textContent =  "\u00a0( " + (i+1) + " )";

			equations[i].appendChild(eqNumber);
			
			// remove class from original element -- otherwise class could be applied to whole equation
			equations[i].id = "";
			equations[i].classList.remove("eqNum");   
		}
	}
} */