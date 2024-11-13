'use strict';
function addEventOnElements(elements, eventType, callback) {
  // Your code to add events to elements here
  elements.forEach(element => element.addEventListener(eventType, callback));
}

// TOGGLE SIDEBAR ON SMALL SCREEN
const sidebar = document.querySelector('[data-sidebar]');
const sidebarToggle = document.querySelectorAll('[data-sidebar-toggler]');
const overlay = document.querySelector('[data-sidebar-overlay]');

const sidebarToggler = function () {
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
};

sidebarToggle.forEach(sidebarTogged =>
  sidebarTogged.addEventListener('click', sidebarToggler)
);

// INITIALIZE TOOLTIP BEHAVIOR FOR ALL DOM ELEMENT WITH A 'DATA-TOOLTIP' ATTRIBUTE //
const tooltip = function (element) {
  const tooltip = document.createElement('span');
  tooltip.classList.add('tooltip', 'text-body-small');

  element.addEventListener('mouseenter', function () {
    tooltip.textContent = this.dataset.tooltip;

    const { top, left, height, width } = this.getBoundingClientRect();

    tooltip.style.top = top + height + 4 + 'px';
    tooltip.style.left = left + width / 2 + 'px';
    tooltip.style.transform = 'translate(-50% 0)';
    document.body.appendChild(tooltip);
  });

  element.addEventListener('mouseleave', tooltip.remove.bind(tooltip));
};

const tooltipElement = document.querySelectorAll('[data-tooltip]');

tooltipElement.forEach(element => tooltip(element));

// SHOW GREETING MESSAGE ON HOMEPAGE
const greetElement = document.querySelector('[data-greeting]');
const currentHour = new Date().getHours();

const getGreetingMsg = function (currentHour) {
  const greeting =
    currentHour < 5
      ? 'Night'
      : currentHour < 12
      ? 'Morning'
      : currentHour < 15
      ? 'Noon'
      : currentHour < 17
      ? 'Afternoon'
      : currentHour < 20
      ? 'Evening'
      : 'Night';

  return `Good ${greeting}`;
};

greetElement.textContent = getGreetingMsg(currentHour);

// SHOW CURRENT DATE ON HOMEPAGE
const currentDateElement = document.querySelector('[data-current-date]');

currentDateElement.textContent = new Date().toDateString().replace(' ', ', ');

//  NOTEBOOK CREATE FIELD
const addNote = document.querySelector('[data-add-notebook]');
const sidebarList = document.querySelector('[data-sidebar-list]');
const notePanelTitle = document.querySelector('[data-note-panel-title]');
const notePanel = document.querySelector('[data-note-panel]');
const noteCreateBtn = document.querySelectorAll('[data-note-create-btn]');
const emptyNotesTemplate = ` 
<div class="empty-notes">
  <span class="material-symbols-rounded" aria-hidden="true">note_stack</span>

  <div class="text-headline-small">No notes</div>
</div>`;

// Enables or disables "Create Note" buttons based on whether there are any notes
const disableNoteCreateBtn = function (isThereAnyNotebook) {
  noteCreateBtn.forEach(item => {
    item[isThereAnyNotebook ? 'removeAttribute' : 'setAttribute'](
      'disabled',
      ''
    );
  });
};

// shows a notebook creation field in the sidebar when the "Add Notebook" button is clicked
// The function dynamically adds a new notebook field element, makes it editable and listens for the 'enter' key to create a new notebook when pressed

let lastActiveNavItem;

const activeNotebook = function () {
  lastActiveNavItem?.classList.remove('active');
  this.classList.add('active'); // this: navItem
  lastActiveNavItem = this;
};

const makeElementEdit = function (element) {
  element.setAttribute('contenteditable', true);
  element.focus();
};

const generateID = function () {
  return new Date().getTime().toString();
};

// finds a notebook in database by its ID
const findNotebook = function (db, notebookID) {
  return db.notebooks.find(notebook => notebook.id === notebookID);
};

// Find Notebook index in an array for delete  based off its ID
const findNotebookIndex = function (db, notebookID) {
  return db.notebooks.findIndex(item => item.id === notebookID);
};

// Converts a timestamp in milliseconds to a human-readable  relative time string
const getRelativeTime = function (milliseconds) {
  const currentTime = new Date().getTime();

  const minute = Math.floor((currentTime - milliseconds) / 1000 / 60);
  const hour = Math.floor(minute / 60);
  const day = Math.floor(hour / 24);

  return minute < 1
    ? 'Just now'
    : minute < 60
    ? `${minute} min ago`
    : hour < 24
    ? `${hour} hour ago`
    : `${day} day ago`;
};

// Finds a specific note by  its ID within a database of notebooks and their notes
const findNote = (db, noteId) => {
  let note;

  for (const notebook of db.notebooks) {
    note = notebook.notes.find(note => note.id === noteId);
    if (note) break;
  }

  return note;
};

// Finds the index of a note in a notebook array of notes based on its iD
const findNoteIndex = function (notebook, noteId) {
  return notebook.notes.findIndex(note => note.id === noteId);
};

//
const showNotebookField = function () {
  const navItem = document.createElement('div');

  navItem.classList.add('nav-item');

  navItem.innerHTML = `
    <span class="text text-label-large" data-notebook-field></span>

    <div class="state-layer"></div>
  `;

  sidebarList.appendChild(navItem);

  const navItemField = navItem.querySelector('[data-notebook-field]');

  // Active new created notebook and deactivate the last one
  activeNotebook.call(navItem);

  // Make notebook field content editable and focus
  makeElementEdit(navItemField);

  // When user press "Enter" then create new note

  navItemField.addEventListener('keydown', createNotebook);
};

addNote.addEventListener('click', showNotebookField);

// DATABASE
let noteKeeperDB = {};

const initDB = function () {
  const db = localStorage.getItem('noteKeeperDB');

  if (db) {
    noteKeeperDB = JSON.parse(db);
  } else {
    noteKeeperDB.notebooks = [];
    localStorage.setItem('noteKeeperDB', JSON.stringify(noteKeeperDB));
  }
};

initDB();

// Read and Loads the local storage data into the global variable 'notekeperDB'
const readDB = function () {
  noteKeeperDB = JSON.parse(localStorage.getItem('noteKeeperDB'));
};

// Writes the current state of the global variable 'noteKeeperDB'  to local storage
const writeDB = function () {
  localStorage.setItem('noteKeeperDB', JSON.stringify(noteKeeperDB));
};

const db = {
  post: {
    notebook(name) {
      readDB();

      const notebookData = {
        id: generateID(),
        name,
        notes: [],
      };

      noteKeeperDB.notebooks.push(notebookData);

      writeDB();

      return notebookData;
    },

    // adds a new note to a specified  notebook in the database
    note(notebookID, object) {
      readDB();

      const notebook = findNotebook(noteKeeperDB, notebookID);

      const noteData = {
        id: generateID(),
        notebookID,
        ...object,
        postedOn: new Date().getTime(),
      };

      notebook.notes.unshift(noteData);

      writeDB();

      return noteData;
    },
  },

  get: {
    // retrieve  all notebooks from database
    notebook() {
      readDB();

      return noteKeeperDB.notebooks;
    },

    // Retrieves all notes within a specified notebook
    note(notebookID) {
      readDB();

      const notebook = findNotebook(noteKeeperDB, notebookID);
      return notebook.notes;
    },
  },

  update: {
    notebook(notebookID, name) {
      readDB();

      const notebook = findNotebook(noteKeeperDB, notebookID);
      notebook.name = name;

      writeDB();

      return notebook;
    },

    note(noteId, object) {
      readDB();

      const oldNote = findNote(noteKeeperDB, noteId);

      const newNote = Object.assign(oldNote, object);

      writeDB();

      return newNote;
    },
  },

  delete: {
    notebook(notebookID) {
      readDB();

      const notebookIndex = findNotebookIndex(noteKeeperDB, notebookID);
      console.log(notebookIndex);
      noteKeeperDB.notebooks.splice(notebookIndex, 1);

      writeDB();
    },

    // Delete note from specified notebook data  in the database
    note(notebookID, noteId) {
      readDB();

      const notebook = findNotebook(noteKeeperDB, notebookID);
      const noteIndex = findNoteIndex(notebook, noteId);

      notebook.notes.splice(noteIndex, 1);

      writeDB();

      return notebook.notes;
    },
  },
};

// MODAL
const overlayModal = document.createElement('div');
overlayModal.classList.add('overlay', 'modal-overlay');

// Creates and manages a modal for adding or ediiting  notes. The modal allows users to input a note title and text, and provides functionality to submit and save the note
const noteModal = function (
  title = 'Untitled',
  text = 'Add your not ...',
  time = ''
) {
  const modal = document.createElement('div');
  modal.classList.add('modal');

  modal.innerHTML = ` <button
      class="icon-btn large"
      aria-label="Close modal" data-close-btn
    >
      <span class="material-symbols-rounded" aria-hidden="true">close</span>

      <div class="state-layer"></div>
    </button>

    <input
      type="text"
      placeholder="Untitled"
      value="${title}"
      class="modal-title text-title-medium"
      data-note-field
    />

    <textarea
      placeholder="Take a note ..."
      class="modal-text text-body-large custom-scrollbar"
      data-note-field
    >
${text}</textarea
    >

    <div class="modal-footer">
      <span class="time text-label-large">${time}</span>

      <button class="btn text" data-submit-btn>
        <span class="text-label-large">Save</span>

        <div class="state-layer"></div>
      </button>
    </div>`;

  const submitBtn = modal.querySelector('[data-submit-btn]');
  submitBtn.disabled = true;

  const [titleField, textField] = modal.querySelectorAll('[data-note-field]');

  const enableSubmit = function () {
    submitBtn.disabled = !titleField.value && !textField.value;
  };

  textField.addEventListener('keyup', enableSubmit);
  titleField.addEventListener('keyup', enableSubmit);
  // opens note modal by appending it to the document body and setting focus on the title field

  const open = function () {
    document.body.appendChild(modal);
    document.body.appendChild(overlay);
    titleField.focus();
  };

  // closes the note modal by removing it from document body
  const close = function () {
    document.body.removeChild(modal);
    document.body.removeChild(overlay);
    titleField.focus();
  };

  // Attach click event to closeBtn, when clicked the modal closes
  const closeBtn = modal.querySelector('[data-close-btn]');
  closeBtn.addEventListener('click', close);

  // Handles the submission of a note with within modal
  const onSubmit = function (callback) {
    submitBtn.addEventListener('click', function () {
      const noteData = {
        title: titleField.value,
        text: textField.value,
      };

      callback(noteData);
    });
  };

  return { open, close, onSubmit };
};

const deleteConfirmModal = function (title) {
  // creates and manage a modal for delete confirming

  const modal = document.createElement('div');
  modal.classList.add('modal');

  modal.innerHTML = `
    <h3 class="modal-title text-title-medium">
      Are you sure you want to delete <strong>"${title}"</strong>?
    </h3>

    <div class="modal-footer">
      <button class="btn text" data-action-btn="false">
        <span class="text-label-large">Cancel</span>

        <div class="state-layer"></div>
      </button>

      <button class="btn fill" data-action-btn="true">
        <span class="text-label-large">Delete</span>

        <div class="state-layer"></div>
      </button>
    </div>
  `;

  // Open the delete confirmation modal by appending it to the d document body

  const open = function () {
    document.body.appendChild(modal);
    document.body.appendChild(overlayModal);
  };

  // Close the delete confirmation modal by removing it from the document body
  const close = function () {
    document.body.removeChild(modal);
    document.body.removeChild(overlayModal);
  };

  // handles the submission of the delete confirmation
  const actionBtns = modal.querySelectorAll('[data-action-btn]');
  const onSubmit = function (callback) {
    actionBtns.forEach(btn =>
      btn.addEventListener('click', function () {
        const isConfirm = this.dataset.actionBtn === 'true' ? true : false;

        callback(isConfirm);
      })
    );
  };

  return { open, close, onSubmit }; // WHY???
};

// NAV ITEMS
// Creates a navigation item representing a notebook. This item displays the notebooks name, allows editing and deleting and handles click events to display associated notes

const NavItem = function (id, name) {
  const navItem = document.createElement('div');
  navItem.classList.add('nav-item');
  navItem.setAttribute('data-notebook', id);

  navItem.innerHTML = `
    <span class="text text-label-large" data-notebook-field>${name}</span>

    <button
      class="icon-btn small"
      aria-label="Edit notebook"
      data-tooltip="Edit notebook"
      data-edit-btn
    >
      <span class="material-symbols-rounded" aria-hidden="true">edit</span>

      <div class="state-layer"></div>
    </button>

    <button
      class="icon-btn small"
      aria-label="Delete notebook"
      data-tooltip="Delete notebook"
      data-delete-btn
    >
      <span class="material-symbols-rounded" aria-hidden="true">delete</span>

      <div class="state-layer"></div>
    </button>

    <div class="state-layer"></div>
  `;

  // Show tooltip on edit and delete
  const tooltipElement = navItem.querySelectorAll('[data-tooltip]');
  tooltipElement.forEach(elem => tooltip(elem));

  // Handles the click event on the navigation item. updates the note panel title retrieves the associated notes, and marks the item as active

  navItem.addEventListener('click', function () {
    notePanelTitle.textContent = name;
    activeNotebook.call(this);

    const noteList = db.get.note(this.dataset.notebook);
    client.note.read(noteList);
  });

  // Notebook edit functionality
  const navItemEditBtn = navItem.querySelector('[data-edit-btn]');
  const navItemField = navItem.querySelector('[data-notebook-field]');

  navItemEditBtn.addEventListener(
    'click',
    makeElementEdit.bind(null, navItemField)
  );

  navItemField.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      this.removeAttribute('contenteditable');

      // Update edited data in database

      const updateNotebookData = db.update.notebook(id, this.textContent);

      // Render updated notebook
      client.notebook.update(id, updateNotebookData);
    }
  });

  // Notebook delete functionality
  const navItemDeleteBtn = navItem.querySelector('[data-delete-btn]');

  navItemDeleteBtn.addEventListener('click', function () {
    const modal = deleteConfirmModal(name);

    modal.open();

    modal.onSubmit(function (isConfirm) {
      if (isConfirm) {
        db.delete.notebook(id);
        client.notebook.delete(id);
      }
      // console.log(isConfirm);

      modal.close();
    });
  });

  return navItem;
};

// CARDS
// Creates an html card element representing a note based on provided data
const cardNotes = function (noteData) {
  const { id, title, text, postedOn, notebookID } = noteData;

  const card = document.createElement('div');

  card.classList.add('card');
  card.setAttribute('data-note', id);

  card.innerHTML = ` 
  <h3 class="card-title text-title-medium">${title}</h3>

    <p class="card-text text-body-large">${text}</p>

  <div class="wrapper">
      <span class="card-time text-label-large">${getRelativeTime(
        postedOn
      )}</span>

      <button class="icon-btn large" aria-label="Delete note" data-tooltip="Delete note" data-delete-btn>
        <span class="material-symbols-rounded" aria-hidden="true">delete</span>

        <div class="state-layer"></div>
      </button>
    </div>

  <div class="state-layer"></div>`;

  tooltip(card.querySelector('[data-tooltip]'));

  // Note view and edit functionality
  card.addEventListener('click', function () {
    const modal = noteModal(title, text, getRelativeTime(postedOn));

    modal.open();

    modal.onSubmit(function (noteData) {
      const updatedData = db.update.note(id, noteData);

      // Update the note in the client UI
      client.note.update(id, updatedData);
      modal.close();
    });
  });

  // Note delete functionality
  const deleteBtn = card.querySelector('[data-delete-btn]');

  deleteBtn.addEventListener('click', function (event) {
    event.stopImmediatePropagation();

    const modal = deleteConfirmModal(title);

    modal.open();

    modal.onSubmit(function (isConfirm) {
      if (isConfirm) {
        const existedNotes = db.delete.note(notebookID, id);

        //Update the client UI to reflect note deletion
        client.note.delete(id, existedNotes.length);
      }

      modal.close();
    });
  });

  return card;
};

// CLIENTS
// Creates a new notebook in the UI, based on provided notebook data, DAta representing the new notebook
const client = {
  notebook: {
    create(notebookData) {
      const navItem = NavItem(notebookData.id, notebookData.name);
      sidebarList.appendChild(navItem);
      activeNotebook.call(navItem);
      notePanelTitle.textContent = notebookData.name;
      notePanel.innerHTML = emptyNotesTemplate;
      disableNoteCreateBtn(true);
    },

    read(notebookList) {
      disableNoteCreateBtn(notebookList.length);

      // reads and displays a list of notebooks in the UI
      notebookList.forEach((notebookData, index) => {
        const navItem = NavItem(notebookData.id, notebookData.name);

        if (index === 0) {
          activeNotebook.call(navItem);
          notePanelTitle.textContent = notebookData.name;
        }

        sidebarList.appendChild(navItem);
      });
    },

    // Updates the Ui to reflect changes in a note book
    update(notebookID, notebookData) {
      const oldNotebook = document.querySelector(
        `[data-notebook="${notebookID}"]`
      );
      const newNotebook = NavItem(notebookData.id, notebookData.name);

      notePanelTitle.textContent = notebookData.name;
      sidebarList.replaceChild(newNotebook, oldNotebook);
      activeNotebook.call(newNotebook);
    },

    // delete a note from the UI
    delete(notebookID) {
      const deletedNotebook = document.querySelector(
        `[data-notebook="${notebookID}"]`
      );
      const activeNavItem =
        deletedNotebook.nextElementSibling ??
        deletedNotebook.previousElementSibling;

      if (activeNavItem) {
        activeNavItem.click();
      } else {
        notePanelTitle.innerHTML = '';
        notePanel.innerHTML = '';
        disableNoteCreateBtn(false);
      }

      deletedNotebook.remove();
    },
  },

  note: {
    // Creates a new note card in the UI based on provided note  data

    create(noteData) {
      // clear "empty notes" from "notePanel" if there if no existing note
      if (!notePanel.querySelector('[data-note]')) notePanel.innerHTML = '';

      // Append Card to panel
      const card = cardNotes(noteData);
      notePanel.prepend(card);
    },

    // Reads and Displays a list of notes on the UI
    read(noteList) {
      if (noteList.length) {
        notePanel.innerHTML = '';

        noteList.forEach(noteData => {
          const card = cardNotes(noteData);
          notePanel.appendChild(card);
        });
      } else {
        notePanel.innerHTML = emptyNotesTemplate;
      }
    },

    // Updates a note card in the UI based on provided  note data
    update(noteId, noteData) {
      const oldCard = document.querySelector(`[data-note="${noteId}"]`);
      const newCard = cardNotes(noteData);
      notePanel.replaceChild(newCard, oldCard);
    },

    // Deletes a note card from the UI
    delete(noteId, isNoteExists) {
      document.querySelector(`[data-note="${noteId}"]`).remove();

      if (!isNoteExists) notePanel.innerHTML = emptyNotesTemplate;
    },
  },
};

const createNotebook = function (event) {
  if (event.key === 'Enter') {
    // show new created notebook database
    const notebookData = db.post.notebook(this.textContent || 'Untitled');

    this.parentElement.remove();

    // Render navItem
    client.notebook.create(notebookData);
  }
};

// Render the existing notebook list by retrieving data from the database and passing it to the client

const renderExistingNotebook = function () {
  const notebookList = db.get.notebook();

  client.notebook.read(notebookList);
};
renderExistingNotebook();

// Create new note
const noteCreateBtns = document.querySelectorAll('[data-note-create-btn]');

addEventOnElements(noteCreateBtns, 'click', function () {
  // Create and open a new modal
  const modal = noteModal();

  modal.open();

  // handle the submission of the new note to the database and client

  modal.onSubmit(noteObj => {
    const activeNotebookId = document.querySelector('[data-notebook].active')
      .dataset.notebook;

    const noteData = db.post.note(activeNotebookId, noteObj);

    client.note.create(noteData);
    modal.close();
  });
});

// NOTES
// Renders existing notes in the active notebook. Retrieves note data from the database based on the active notebook ID and uses the client to display the notes
const renderExistedNotebook = function () {
  const activeNotebookId = document.querySelector('[data-notebook].active')
    ?.dataset.notebook;

  if (activeNotebookId) {
    const noteList = db.get.note(activeNotebookId);

    // Display existing note
    client.note.read(noteList);
  }
};

renderExistedNotebook();
