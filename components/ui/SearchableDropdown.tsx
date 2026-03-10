import React, { useState, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { TextInput } from './TextInput';

interface SearchableDropdownProps {
  options: string[];
  value: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  label: string;
  error?: string;
}

export function SearchableDropdown({
  options,
  value,
  onSelect,
  placeholder,
  label,
  error,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState(value ?? '');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return options;
    const lower = query.toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(lower));
  }, [query, options]);

  const handleSelect = (item: string) => {
    setQuery(item);
    onSelect(item);
    setOpen(false);
  };

  return (
    <View className="mb-4 z-10">
      <TextInput
        label={label}
        placeholder={placeholder}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        error={error}
      />
      {open && filtered.length > 0 && (
        <ScrollView
          className="bg-white border border-border rounded-xl -mt-2"
          style={{ maxHeight: 192 }}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {filtered.map((item) => (
            <Pressable
              key={item}
              onPress={() => handleSelect(item)}
              className="px-4 py-3 border-b border-border"
              testID={`dropdown-item-${item}`}
            >
              <Text className="text-text-primary text-base">{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
