/***** To-do ******
- Document the CRLF issue in Windows
- Multiple-line highlighting in code
- Merge box-shadow/section/web and border/div/print?
- Document how to use equation numbering / referencing
- Scrollable codeblocks (done)
- test videos from multiple sources (Kaltura, Youtube, file in class)
- check webpages with ref=
- Linking to figure when below can cut off top  
- stop page breaks from breaking up a codeblock and its a codeblock tab in print mode
- test highlighting of code line (done -- want to improve)
- Hosted on GitHub Pages forcing a manual copy to docs folder.  
  - Could do a GitHub action or use jsdelivr instead
****************/

// Shared settings and state
const smallImageWidth = 150;  // width of minimized images
let scrollTopPosition = 0;    // saved position for returning after following a link
let referenceTimer = null;    // timer for reference highlighting
let scrollFlag = 0;          // number of reference-link scrolling events

// Long-click menu state
let longClickTimer = null;
let overRCMenu = false;

let notifTimer = null;

// keep mouse positions in global memory because they can only be captured on mouse events
// Shared state for long-click menus and image resizing.
let mouseX = 0;
let mouseY = 0;
let mouseX2 = 0;
let mouseY2 = 0;
let clickMode = null;
let fsClick = null;
let origWidth = null;

let encapObject = null;       // main document element

// Initialize custom Quarto page behavior after the window finishes loading.
window.addEventListener("load", function()
{		

	encapObject = document.body; 
	scrollTopPosition = window.scrollY;  
  
	// Add a print button to the lesson title.
	const titleObj = encapObject.querySelector(".title");

	if(titleObj != null)
	{
		// Ensure the primary Quarto title is visible.
		titleObj.classList.remove("d-none");

		// Create the print icon.
		const printLink = document.createElement("a");
		printLink.classList.add("self");
		printLink.style.marginLeft = "9px";
		printLink.innerHTML = "&#9113";
		printLink.href = "#";
		printLink.title = "Print or save as PDF";

		// Print the page when the icon is clicked.
		printLink.addEventListener("click", function(event)
		{
			event.preventDefault();
			window.print();
		});

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
	formatTOCSidebar();
	
	// Create a long-click menu
	makeContextMenu();  // needs to happen after divs are created
		
	// check the URL to see if there is a request to go to a specific part of the page
	checkURLForPos();
	
	// target most hyperlinks to a new window
	linksToNewWindow();
	
	// if this page was hyperlinked from elsewhere and a hash tag was added to the link
	if(window.location.hash.slice(1) != "")
	{
		scrollToElement(window.location.hash.slice(1));
	}
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
	// Respond only to the primary mouse button.
	if(event.button == 0)
	{
		clickMode = "click";
		// keep track of mouse position during timer
		window.addEventListener("mousemove", getMousePos);	
		
		// get current position of mouse -- save to start and final position
		mouseX = event.clientX;
		mouseX2 = event.clientX;
		mouseY = event.clientY;
		mouseY2 = event.clientY;
		
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

	if(!overRCMenu)
	{
		encapObject.querySelector("#longClickMenu").style.visibility = "hidden";
		encapObject.querySelector("#longClickMenu").style.top = "0px";
		encapObject.style.userSelect = "";
	}
});

function activateNotification()
{
	let notifDiv = encapObject.querySelector("#notification");

	// Create the notification if it does not already exist.
	if(notifDiv == null)
	{
		notifDiv = document.createElement("div");
		notifDiv.id = "notification";
		notifDiv.classList.add("rcMenu");
		encapObject.appendChild(notifDiv);
	}
	else
	{
		// Cancel the previous timer if the notification is already present.
		clearTimeout(notifTimer);
	}

	// Display a message after scrolling to a referenced element.
	notifDiv.innerHTML = "Hold left mouse button to return to previous location";
	notifDiv.style.visibility = "visible";

	// Hide the notification after two seconds.
	notifTimer = setTimeout(function()
		{
			notifDiv.style.visibility = "hidden";
		}, 2000);
}

// Position the long-click menu near the mouse pointer.
function activateElement(e, element, offset = 5)
{			
	const rcMenuDim = element.getBoundingClientRect();
	
	if(window.innerWidth - e.clientX < rcMenuDim.width)  
	{
		element.style.left = (window.scrollX + e.clientX - rcMenuDim.width + offset) + "px";
	}
	else
	{
		element.style.left = (window.scrollX + e.clientX - offset) + "px";
	}
	
	// Position the element above the pointer if there is not enough
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
Find all images within the page that have the "fs" class
and add click events that give the user the ability to change 
the size of the image.  Called on page load.
*/
function createFlexImages()
{
	// Find videos and embedded iframes marked for resizing.
	const flexVideo = encapObject.querySelectorAll('video.fs');
	const flexIframe = encapObject.querySelectorAll("div.fs iframe, p.fs > iframe");
  
  // find all figures within a fs div -- in Quarto these are plots from embedded scripts
	const quartoFS = document.querySelectorAll("div.fs img.figure-img");
	for(let i=0; i<quartoFS.length; i++)
	{
		// add fs directly to the image
		quartoFS[i].classList.add("fs");
	}
	
	// find all flexsized images
	const fsObj = document.querySelectorAll("img.fs");

	// for each flexsized image
	for(let i=0; i<fsObj.length; i++)
	{	
		// mousedown: set the flexsized object
		fsObj[i].addEventListener("mousedown", function(event)
		{
			if(event.button == 0)
			{		
				fsClick = fsObj[i];
				fsClick.style.cursor = "ew-resize";
				fsClick.ondragstart = function() {return false;};
			}
		});
		fsObj[i].addEventListener("mouseup", function(event)
		{
			if(event.button == 0)
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

		//initialize image to small size
		changeImageSize(fsObj[i], "minimize");
	}
	
	// go through all the videos...
	for(let i=0; i<flexVideo.length; i++)	
	{
		const videoHeight = flexVideo[i].height;
		const videoWidth = flexVideo[i].width;
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
		const iframeHeight = flexIframe[i].height; 
		const iframeWidth = flexIframe[i].width; 
		flexIframe[i].height = smallImageWidth *  iframeHeight / iframeWidth;
		flexIframe[i].width = smallImageWidth;

		// create a small span button 
		const resizeButton = document.createElement("span");
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
					// Some embedded video players (possibly Kaltura) do not adjust
					// their internal layout when the iframe is resized.
					// Reload the iframe so the player initializes at the new dimensions.
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

// Resize an image when clicked or when a shortcut-menu command is selected.
// Instructions: minimize, maximize, or half.
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
		const currentWidth = element.clientWidth;   // current image width
		let naturalWidth = element.naturalWidth;    // starting image width
		const parentWidth = element.parentElement.clientWidth;  // width of parent frame 
		
		if(naturalWidth >= parentWidth) 
		{
		  naturalWidth = parentWidth
		}
		if( (naturalWidth - currentWidth) < (currentWidth - smallImageWidth) ||
		    (naturalWidth < element.width))
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


/* call from long-click menu in page to either minimize or maximize (param)
	all the flex-sized images in the page */
function changeAllPicSize(param)
{
	// Quarto will add class names to the div around the image 
	const flexImage = encapObject.querySelectorAll('img.fs');
	for(let i=0; i<flexImage.length; i++)
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

function makeContextMenu()
{
	// Create the shortcut menu.
	const elemDiv = document.createElement("div");
	elemDiv.id = "longClickMenu";
	elemDiv.classList.add("rcMenu", "sameWin", "noSelect");
	elemDiv.innerHTML = "<b>Shortcut Menu</b>";

	// Track whether the mouse is over the menu.
	elemDiv.addEventListener("mouseenter", function()
	{
		overRCMenu = true;
	});

	elemDiv.addEventListener("mouseleave", function()
	{
		overRCMenu = false;
	});

	// Add menu commands.
	menuLinks(elemDiv, "Return to previous location", goBackToPrevLocation, "previousLocMenuItem", false);
	menuLinks(elemDiv, "Go to Top of Page", goToTopOfPage, "topMenuItem");

	menuLinks(elemDiv, "Print/ Save as PDF", function()
	{
		document.getElementById("longClickMenu").style.visibility = "hidden";
		window.print();
	}, "printToPDF");

	menuLinks(elemDiv, "Maximize All Images", function()
	{
		changeAllPicSize("maximize");
	}, "maxAllImages");

	menuLinks(elemDiv, "Minimize All Images", function()
	{
		changeAllPicSize("minimize");
	}, "minAllImages");

	menuLinks(elemDiv, "All Images 50%", function()
	{
		changeAllPicSize("half");
	}, "halfImages");

	encapObject.appendChild(elemDiv);
}

function menuLinks(menu, text, command, linkid = "", enable = true)
{
	// Create a menu item.
	const spanEncap = document.createElement("span");
	spanEncap.style.display = "block";

	const link = document.createElement("a");
	link.id = linkid;
	link.innerText = text;
	link.classList.add("sameWin", "jsLink");

	if(!enable)
	{
		link.classList.add("disabledLink");
	}

	// Execute the command and close the menu.
	link.addEventListener("mouseup", function(event)
	{
		command();

		const menuDiv = document.getElementById("longClickMenu");
		menuDiv.style.visibility = "hidden";
		menuDiv.style.top = "0px";
	});

	spanEncap.appendChild(link);
	menu.appendChild(spanEncap);
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

function scrollToElement(elementID)
{		
	const element = document.getElementById(elementID); 

	// Ignore references to elements that do not exist.
	if(element == null)
	{
		console.warn("Reference element not found: " + elementID);
		return;
	}

	// Make referenced code lines visible within scrollable code blocks.
	// closest goes up the HTML hierachy
	if(element.tagName == "SPAN" && element.closest("pre.sourceCode"))
	{
		scrollToCodeLine(element);
	}

	const windowHeight = window.innerHeight; // height of the webpage with the lesson
	const windowScroll = window.scrollY; 	 // amount window has been scrolled
	let offsetPadding = 0;

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
		window.scrollTo(window.scrollX, elementYPos - offsetPadding);
		
		scrollFlag = scrollFlag +1;
		if(scrollFlag <= 2) 
		{
    		activateNotification();
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
		window.scrollTo(window.scrollX, elementYPos - offsetPadding);
		enablePrevious();
	}

	highLightObject(element);
}

function highLightObject(element, time = 2000)
{
	// Quarto headings use data-anchor-id rather than the heading's ID.
	let refElement = document.querySelector("[data-anchor-id='" + element.id + "']");

	if(refElement == null)
	{
		refElement = element;
	}

	// Highlight code-line spans directly.
	// For other spans, highlight the parent element.
	if(refElement.tagName == "SPAN" && !refElement.closest("pre.sourceCode"))
	{
		refElement = refElement.parentElement;
	}

	// Remove any existing reference highlight.
	const previousHighlight = encapObject.querySelector(".refObjHighlight");

	if(previousHighlight != null)
	{
		previousHighlight.classList.remove("refObjHighlight");
		clearTimeout(referenceTimer);
	}

	// Highlight the referenced element temporarily.
	refElement.classList.add("refObjHighlight");

	referenceTimer = setTimeout(function()
	{
		refElement.classList.remove("refObjHighlight");
	}, time);
}

function enablePrevious()
{	
	// change the long-click menu to show the return link
	const prevLocLink = document.getElementById("previousLocMenuItem");
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
		const newWidth = origWidth + mouseX2 - mouseX;

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
		const currentWidth = fsClick.clientWidth;    // current width
		const naturalWidth = fsClick.naturalWidth;   // starting width
		
		if( (naturalWidth - currentWidth) < (currentWidth - smallImageWidth) ||
	    (naturalWidth < fsClick.width))
			fsClick.style.cursor = "zoom-out";
		else
			fsClick.style.cursor = "zoom-in";
			
		fsClick.classList.remove("resizing");
	}
	clickMode = null;	
	fsClick = null;
}

function formatTOCSidebar()
{
   // find table of contents
	const toc = document.querySelector("nav.toc-active");

	// find sidebar
	const sidebar = document.querySelector("div.sidebar-item-container");
	
	// if both sidebar and toc exists...
	if(sidebar !== null && toc !== null)
	{
		// move the toc before the sidebar
		sidebar.parentNode.insertBefore(toc, sidebar);
	}
	
	// find search bar
	const searchBar = document.querySelector(".sidebar-search input");
	
	// Customize the search box placeholder.
	if (searchBar !== null)  
		searchBar.setAttribute("placeholder", "Search all lessons");
}

// Scroll a code block to make a referenced line visible.
function scrollToCodeLine(element)
{
	const codeBlock = element.closest("pre.sourceCode");

	if(codeBlock == null)
	{
		return;
	}

	// Only scroll if the code block has overflowed.
	if(codeBlock.scrollHeight <= codeBlock.clientHeight)
	{
		return;
	}

	// Determine the line's position relative to the code block.
	const lineRect = element.getBoundingClientRect();
	const blockRect = codeBlock.getBoundingClientRect();

	// Scroll the code block if the line is outside its visible area.
	if(lineRect.top < blockRect.top || lineRect.bottom > blockRect.bottom)
	{
		codeBlock.scrollTop += lineRect.top - blockRect.top - 20;
	}
}

// ------------------------------------------------------------
// Preserve the first visible lesson block during window resizing.
//
// Horizontal and diagonal resizing can cause text to reflow,
// shifting the lesson vertically. Keep the first visible block
// (paragraph, heading, code block, etc.) at its original position.
//
// Vertical-only resizing is left to the browser.
// Quarto's responsive layout, including sidebar transitions,
// remains unchanged.
// ------------------------------------------------------------

function initializeResizeAnchoring() {
  const content = document.querySelector("#quarto-document-content");
  if (!content) return;

  let anchor = null;
  let lastWidth = window.innerWidth;
  let resizeTimer = null;
  let frameId = null;
  let resizing = false;

  function findAnchor() {
    const blocks = content.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, pre, figure, table, ul, ol, blockquote"
    );

    const top = Math.max(
      0,
      document.querySelector("#quarto-header")?.getBoundingClientRect().bottom || 0
    );

    for (const element of blocks) {
      const rect = element.getBoundingClientRect();

      if (rect.bottom > top && rect.top < window.innerHeight) {
        return {
          element,
          y: rect.top
        };
      }
    }

    return null;
  }

  function restoreAnchor() {
    if (!anchor || !anchor.element.isConnected) return;

    const difference =
      anchor.element.getBoundingClientRect().top - anchor.y;

    if (!Number.isFinite(difference)) return;

    if (Math.abs(difference) > 0.5) {
      window.scrollBy({
        top: difference,
        behavior: "instant"
      });
    }
  }

  function cancelPending() {
    clearTimeout(resizeTimer);
    resizeTimer = null;

    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  window.addEventListener("scroll", () => {
    if (!resizing) {
      anchor = findAnchor();
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const widthChanged = width !== lastWidth;

    lastWidth = width;

    // Vertical-only resizing: do not adjust scrolling.
    if (!widthChanged) {
      cancelPending();
      resizing = false;
      anchor = findAnchor();
      return;
    }

    // Horizontal or diagonal resizing.
    resizing = true;
    cancelPending();

    restoreAnchor();

    // Correct again after the browser updates the layout.
    frameId = requestAnimationFrame(() => {
      frameId = null;
      restoreAnchor();
    });

    // Reestablish the anchor after resizing stops.
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      restoreAnchor();
      resizing = false;
      anchor = findAnchor();
    }, 200);
  });

  anchor = findAnchor();
}

// Initialize after the document has loaded.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeResizeAnchoring);
} else {
  initializeResizeAnchoring();
}