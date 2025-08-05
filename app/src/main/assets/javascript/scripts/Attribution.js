// This function creates the attribution elements.
function createAttributionElements(mainContainer) {
  const attributionButton = $(
    `<button class="attribution-button pop-button box-shadow-element">?</button>`
  );
  mainContainer.append(attributionButton);
  attributionButton.on('mouseenter', () => {
    attributionButton.css({
      height: 'auto',
      width: 'auto',
    });
    attributionButton.text('MAP TILES BY ESRI: EARTHSTAR GEOGRAPHICS.');
  });
  attributionButton.on('mouseleave', () => {
    attributionButton.text('?');
    attributionButton.css({
      height: '',
      width: '',
    });
  });
}
