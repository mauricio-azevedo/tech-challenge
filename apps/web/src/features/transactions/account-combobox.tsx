'use client';

import {
  useEffect,
  useId,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

import { Input } from '@/components/ui/input';
import { formatShortDateTime } from '@/lib/transaction-labels';
import { cn } from '@/lib/utils';

import { normalizeAccountId } from './account-id';
import type { RecentAccount } from './recent-accounts';

/**
 * Campo de conta com autocomplete: continua sendo um input (digitar, colar, o botao de gerar), e a
 * lista de contas ja usadas abre por baixo, filtrada pelo que esta digitado. Semantica de combobox
 * com lista (`aria-activedescendant`), entao o foco nunca sai do campo — as setas so movem o
 * destaque, Enter escolhe e Esc fecha.
 *
 * A lista e posicionada no proprio campo, e nao num Popover do Radix: como o foco fica no input
 * (que esta fora do conteudo do popover), o Radix dispensaria a camada no mesmo instante em que ela
 * abre. Quem abre e fecha aqui e o campo — foco, digitacao, Esc, escolha e blur.
 */
export function AccountCombobox({
  id,
  value,
  accounts,
  placeholder,
  describedBy,
  invalid,
  onChange,
  onBlur,
  suffix,
}: {
  id: string;
  value: string;
  accounts: RecentAccount[];
  placeholder: string;
  describedBy: string | undefined;
  invalid: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  suffix: ReactNode;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = accounts.filter((account) => account.id.includes(value));
  const isOpen = open && matches.length > 0;
  const optionId = (index: number) => `${listId}-${String(index)}`;

  const select = (account: RecentAccount) => {
    onChange(account.id);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setOpen(true);
        setActive(0);
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + matches.length) % matches.length);
      return;
    }
    if (!isOpen) return;
    if (event.key === 'Enter') {
      const account = matches[active];
      if (account === undefined) return;
      // Escolher da lista nao envia o formulario.
      event.preventDefault();
      select(account);
      return;
    }
  };

  /**
   * O Esc fecha a lista, nao o dialog. O Radix Dialog escuta Escape no `document` em fase de
   * captura, entao um handler no proprio campo chegaria tarde demais — o dialog ja teria fechado.
   * Na captura do `window`, um nivel acima, a lista fecha primeiro e o evento morre ali.
   */
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
      setActive(-1);
    };
    window.addEventListener('keydown', closeOnEscape, { capture: true });
    return () => {
      window.removeEventListener('keydown', closeOnEscape, { capture: true });
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={isOpen && active >= 0 ? optionId(active) : undefined}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        autoComplete="off"
        placeholder={placeholder}
        className="h-9 pr-9 font-mono text-[13px]"
        value={value}
        onChange={(event) => {
          onChange(normalizeAccountId(event.target.value));
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
          onBlur();
        }}
        onKeyDown={onKeyDown}
      />
      {suffix}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 max-h-56 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
          <p className="px-2 pt-1 pb-1.5 text-[11px] text-muted-foreground">Usadas recentemente</p>
          <ul id={listId} role="listbox" aria-label="Contas usadas recentemente">
            {matches.map((account, index) => (
              <li
                key={account.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5',
                  index === active && 'bg-muted',
                )}
                // O mousedown tiraria o foco do campo e fecharia a lista antes do clique.
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onClick={() => {
                  select(account);
                }}
              >
                <span className="font-mono text-[12.5px]">{account.id}</span>
                <span className="shrink-0 text-[11.5px] text-muted-foreground">
                  {formatShortDateTime(account.lastUsedAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
