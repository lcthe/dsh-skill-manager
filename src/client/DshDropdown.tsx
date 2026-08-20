import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import css from './skill-manager.module.css'

export interface DshDropdownOption {
  readonly value: string
  readonly label: string
}

export interface DshDropdownProps {
  readonly value: string
  readonly options: readonly DshDropdownOption[]
  readonly onChange: (value: string) => void
  readonly ariaLabel: string
  readonly className?: string
}

export function DshDropdown({ value, options, onChange, ariaLabel, className }: DshDropdownProps): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex)
  const selectedOption = options[selectedIndex] ?? options[0]
  const menuId = useMemo(() => `dsh-dropdown-${Math.random().toString(36).slice(2)}`, [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    setHighlightedIndex(selectedIndex)
    requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus())
  }, [open, selectedIndex])

  const openMenu = (index = selectedIndex) => {
    if (options.length === 0) return
    setHighlightedIndex(index)
    setOpen(true)
  }

  const closeMenu = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    closeMenu(true)
  }

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openMenu(selectedIndex)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(Math.max(0, selectedIndex - 1))
    }
  }

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((index) => (index + 1) % options.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((index) => (index - 1 + options.length) % options.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setHighlightedIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setHighlightedIndex(options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(highlightedIndex)
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault()
      closeMenu(true)
    }
  }

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => optionRefs.current[highlightedIndex]?.focus())
  }, [highlightedIndex, open])

  return (
    <div ref={rootRef} className={`${css.dshDropdown} ${className ?? ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={css.dshDropdownButton}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => open ? closeMenu() : openMenu()}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={css.dshDropdownValue}>{selectedOption?.label ?? ''}</span>
        <span className={css.dshDropdownChevron} aria-hidden="true" />
      </button>
      {open && (
        <div id={menuId} className={css.dshDropdownMenu} role="listbox" aria-label={ariaLabel} onKeyDown={onMenuKeyDown}>
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => { optionRefs.current[index] = element }}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`${css.dshDropdownOption} ${option.value === value ? css.dshDropdownOptionSelected : ''} ${index === highlightedIndex ? css.dshDropdownOptionHighlighted : ''}`}
              onClick={() => choose(index)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className={css.dshDropdownOptionLabel}>{option.label}</span>
              {option.value === value && <span className={css.dshDropdownCheck} aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
