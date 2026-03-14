import React, { useState, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { TextInput } from './TextInput';
import { Colors } from '@/constants/colors';

export interface DropdownOption {
  label: string;
  value: string;
}

interface SearchableDropdownProps {
  options: string[] | DropdownOption[];
  value: string | null;
  onSelect: (value: string | null) => void;
  placeholder?: string;
  label: string;
  error?: string;
  /** Show all options immediately when focused, before the user types anything */
  showAllOnFocus?: boolean;
  /** When true, only values selected from the dropdown list are accepted.
   *  Free-text input is used for filtering only, not committed as the value. */
  strictMode?: boolean;
}

function normalizeOptions(options: string[] | DropdownOption[]): DropdownOption[] {
  if (options.length === 0) return [];
  if (typeof options[0] === 'string') {
    return (options as string[]).map((o) => ({ label: o, value: o }));
  }
  return options as DropdownOption[];
}

export function SearchableDropdown({
  options,
  value,
  onSelect,
  placeholder,
  label,
  error,
  showAllOnFocus = false,
  strictMode = false,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState(value ?? '');
  const [open, setOpen] = useState(false);

  const normalized = useMemo(() => normalizeOptions(options), [options]);

  const filtered = useMemo(() => {
    if (!query) return normalized;
    const lower = query.toLowerCase();
    return normalized.filter((o) => o.value.toLowerCase().includes(lower));
  }, [query, normalized]);

  const shouldShow = open && (showAllOnFocus || query.length > 0) && filtered.length > 0;

  const handleSelect = (item: DropdownOption) => {
    setQuery(item.value);
    onSelect(item.value);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    onSelect(null);
    setOpen(true);
  };

  return (
    <View className="mb-4 z-10">
      <View>
        <TextInput
          label={label}
          placeholder={placeholder}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (!strictMode) {
              onSelect(text || null);
            }
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          error={error}
        />
        {strictMode && value ? (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={{ position: 'absolute', right: 12, bottom: 18 }}
            testID="dropdown-clear"
          >
            <Text style={{ color: Colors.textSecondary, fontSize: 18, lineHeight: 22 }}>
              ✕
            </Text>
          </Pressable>
        ) : null}
      </View>
      {shouldShow && (
        <ScrollView
          className="bg-white border border-border rounded-xl -mt-2"
          style={{ maxHeight: 192 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {filtered.map((item, index) => (
            <Pressable
              key={`${item.value}-${index}`}
              onPress={() => handleSelect(item)}
              className="px-4 py-3 border-b border-border"
              testID={`dropdown-item-${item.value}`}
            >
              <Text className="text-text-primary text-base">{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
