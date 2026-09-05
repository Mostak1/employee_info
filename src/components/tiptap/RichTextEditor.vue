<script setup>
import { nextTick, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { Bold, Check, Heading2, Heading3, Italic, Link as LinkIcon, List, ListOrdered, Redo2, Underline as UnderlineIcon, Undo2, Unlink } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Add useful context' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const linkOpen = ref(false)
const linkUrl = ref('')
const linkInput = ref(null)

const editor = useEditor({
  content: props.modelValue || '',
  editable: !props.disabled,
  extensions: [
    // StarterKit includes these extensions in the installed Tiptap version;
    // disable its copies so the configured instances below are registered once.
    StarterKit.configure({ heading: { levels: [2, 3] }, link: false, underline: false }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-content min-h-28 max-h-48 overflow-y-auto px-3 py-2 text-sm leading-6 outline-none',
      role: 'textbox',
      'aria-multiline': 'true',
    },
  },
  onUpdate: ({ editor: currentEditor }) => {
    emit('update:modelValue', currentEditor.getHTML())
  },
})

watch(() => props.modelValue, (value) => {
  if (!editor.value) return
  const nextContent = value || ''
  if (nextContent !== editor.value.getHTML()) {
    editor.value.commands.setContent(nextContent, false)
  }
})

watch(() => props.disabled, (disabled) => {
  editor.value?.setEditable(!disabled)
})

function run(command) {
  if (!editor.value || props.disabled) return
  command(editor.value)
  editor.value.commands.focus()
}

function openLinkEditor() {
  if (!editor.value || props.disabled) return
  linkUrl.value = editor.value.getAttributes('link').href || ''
  linkOpen.value = true
  nextTick(() => linkInput.value?.$el?.focus())
}

function applyLink() {
  if (!editor.value) return
  const url = linkUrl.value.trim()
  if (!url) editor.value.chain().focus().unsetLink().run()
  else editor.value.chain().focus().setLink({ href: url }).run()
  linkOpen.value = false
}

function removeLink() {
  editor.value?.chain().focus().unsetLink().run()
  linkOpen.value = false
}
</script>

<template>
  <div class="rounded-md border border-slate-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-teal-600/30">
    <div class="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-1.5" role="toolbar" aria-label="Description formatting">
      <Button type="button" variant="ghost" size="icon-xs" title="Undo" aria-label="Undo" :disabled="disabled || !editor?.can().undo()" @mousedown.prevent @click="run((instance) => instance.chain().focus().undo().run())"><Undo2 class="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Redo" aria-label="Redo" :disabled="disabled || !editor?.can().redo()" @mousedown.prevent @click="run((instance) => instance.chain().focus().redo().run())"><Redo2 class="size-4" /></Button>
      <span class="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
      <Button type="button" variant="ghost" size="icon-xs" title="Bold" aria-label="Bold" :class="{ 'bg-teal-100 text-teal-800': editor?.isActive('bold') }" :disabled="disabled" @mousedown.prevent @click="run((instance) => instance.chain().focus().toggleBold().run())"><Bold class="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Italic" aria-label="Italic" :class="{ 'bg-teal-100 text-teal-800': editor?.isActive('italic') }" :disabled="disabled" @mousedown.prevent @click="run((instance) => instance.chain().focus().toggleItalic().run())"><Italic class="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Underline" aria-label="Underline" :class="{ 'bg-teal-100 text-teal-800': editor?.isActive('underline') }" :disabled="disabled" @mousedown.prevent @click="run((instance) => instance.chain().focus().toggleUnderline().run())"><UnderlineIcon class="size-4" /></Button>
      <span class="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
      <Button type="button" variant="ghost" size="icon-xs" title="Heading 2" aria-label="Heading 2" :class="{ 'bg-teal-100 text-teal-800': editor?.isActive('heading', { level: 2 }) }" :disabled="disabled" @mousedown.prevent @click="run((instance) => instance.chain().focus().toggleHeading({ level: 2 }).run())"><Heading2 class="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Heading 3" aria-label="Heading 3" :class="{ 'bg-teal-100 text-teal-800': editor?.isActive('heading', { level: 3 }) }" :disabled="disabled" @mousedown.prevent @click="run((instance) => instance.chain().focus().toggleHeading({ level: 3 }).run())"><Heading3 class="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Bullet list" aria-label="Bullet list" :class="{ 'bg-teal-100 text-teal-800': editor?.isActive('bulletList') }" :disabled="disabled" @mousedown.prevent @click="run((instance) => instance.chain().focus().toggleBulletList().run())"><List class="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Numbered list" aria-label="Numbered list" :class="{ 'bg-teal-100 text-teal-800': editor?.isActive('orderedList') }" :disabled="disabled" @mousedown.prevent @click="run((instance) => instance.chain().focus().toggleOrderedList().run())"><ListOrdered class="size-4" /></Button>
      <div class="relative">
        <Button type="button" variant="ghost" size="icon-xs" title="Add link" aria-label="Add link" :class="{ 'bg-teal-100 text-teal-800': editor?.isActive('link') }" :disabled="disabled" @mousedown.prevent @click="openLinkEditor"><LinkIcon class="size-4" /></Button>
        <div v-if="linkOpen" class="absolute left-0 top-9 z-20 flex w-64 gap-1 rounded-md border border-slate-200 bg-white p-2 shadow-lg">
          <Input ref="linkInput" v-model="linkUrl" type="url" placeholder="https://example.com" class="h-8 text-xs" @keydown.enter.prevent="applyLink" />
          <Button type="button" size="icon-xs" title="Apply link" aria-label="Apply link" @click="applyLink"><Check class="size-4" /></Button>
          <Button type="button" variant="ghost" size="icon-xs" title="Remove link" aria-label="Remove link" @click="removeLink"><Unlink class="size-4" /></Button>
        </div>
      </div>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
:deep(.tiptap-content p.is-editor-empty:first-child::before) {
  color: rgb(148 163 184);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.tiptap-content h2) {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.4;
}

:deep(.tiptap-content h3) {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
}

:deep(.tiptap-content ul) {
  list-style: disc;
  padding-left: 1.25rem;
}

:deep(.tiptap-content ol) {
  list-style: decimal;
  padding-left: 1.25rem;
}

:deep(.tiptap-content a) {
  color: rgb(13 148 136);
  text-decoration: underline;
}
</style>
