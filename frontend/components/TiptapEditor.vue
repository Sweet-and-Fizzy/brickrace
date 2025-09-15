<template>
  <div class="border border-gray-300 rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="border-b border-gray-300 bg-gray-50 p-2 flex gap-1 flex-wrap">
      <button
        type="button"
        :class="{ 'bg-gray-300': editor?.isActive('bold') }"
        class="p-2 rounded hover:bg-gray-200 font-bold"
        title="Bold"
        @click="editor?.chain().focus().toggleBold().run()"
      >
        B
      </button>
      <button
        type="button"
        :class="{ 'bg-gray-300': editor?.isActive('italic') }"
        class="p-2 rounded hover:bg-gray-200 italic"
        title="Italic"
        @click="editor?.chain().focus().toggleItalic().run()"
      >
        I
      </button>
      <button
        type="button"
        :class="{ 'bg-gray-300': editor?.isActive('bulletList') }"
        class="p-2 rounded hover:bg-gray-200"
        title="Bullet List"
        @click="editor?.chain().focus().toggleBulletList().run()"
      >
        <i class="pi pi-list" />
      </button>
      <button
        type="button"
        :class="{ 'bg-gray-300': editor?.isActive('orderedList') }"
        class="p-2 rounded hover:bg-gray-200"
        title="Numbered List"
        @click="editor?.chain().focus().toggleOrderedList().run()"
      >
        1.
      </button>
      <button
        type="button"
        :class="{ 'bg-gray-300': editor?.isActive('link') }"
        class="p-2 rounded hover:bg-gray-200"
        title="Link"
        @click="toggleLink"
      >
        <i class="pi pi-link" />
      </button>
    </div>

    <!-- Editor -->
    <div class="p-4 min-h-[320px]">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-gray max-w-none focus:outline-none min-h-[280px]'
    }
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

// Watch for external changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && editor.value.getHTML() !== newValue) {
      editor.value.commands.setContent(newValue)
    }
  }
)

const toggleLink = () => {
  if (editor.value?.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
  } else {
    const url = prompt('Enter URL:')
    if (url) {
      editor.value?.chain().focus().setLink({ href: url }).run()
    }
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
:deep(.ProseMirror) {
  outline: none;
}

:deep(.ProseMirror p) {
  margin: 0.5em 0;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

:deep(.ProseMirror a) {
  color: #3b82f6;
  text-decoration: underline;
}

:deep(.ProseMirror strong) {
  font-weight: bold;
}

:deep(.ProseMirror em) {
  font-style: italic;
}
</style>
